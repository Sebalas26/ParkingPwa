import { apiClient } from '../../../shared/api/apiClient';
import type { AuthRequestDto, AuthResponseDto, UserSession, ActionRoleDto } from '../model/AuthContracts';
import { ALL_PWA_PERMISSIONS_LIST, ALL_PWA_MODULES_LIST } from '../../../shared/auth/rbacConstants';

export const authService = {
  login: async (credentials: AuthRequestDto): Promise<UserSession> => {
    const response = await apiClient.post<AuthResponseDto>('/Auth/login', credentials);

    if (!response || !response.token) {
      throw new Error(response?.errorMessage || response?.message || 'No se pudo obtener el token de autenticación.');
    }

    const userId = response.idUser ?? response.userId ?? 0;
    const roleId = response.idRoleUser ?? response.userRoleId ?? 0;
    const fullName = response.fullname || response.fullName || credentials.username;
    const username = response.username || credentials.username;

    // SuperAdmin solo si el backend expresamente lo indica
    const isSuperAdmin = Boolean(response.isSuperAdmin);
    const isAdminUser = Boolean(response.isAdmin || isSuperAdmin);
    const roleName = response.roleName || (isSuperAdmin ? 'Super Administrador' : (isAdminUser ? 'Administrador' : 'Usuario'));

    // Guardar temporalmente el token para poder llamar a RoleActions si hace falta
    localStorage.setItem('auth_token', response.token);

    // Consultar permisos reales del rol desde la API si la respuesta no traía permisos
    let dynamicPermissions: string[] = response.permissions || [];
    if (!isSuperAdmin && (!dynamicPermissions || dynamicPermissions.length === 0) && roleId > 0) {
      try {
        const roleActions = await apiClient.get<ActionRoleDto[]>(`/RoleActions/PermissionRole/${roleId}`);
        if (roleActions && Array.isArray(roleActions) && roleActions.length > 0) {
          dynamicPermissions = roleActions
            .filter((ra) => ra.isActive)
            .map((ra) => ra.actionName)
            .filter(Boolean);
        }
      } catch (err) {
        console.warn('No se pudieron consultar los permisos del rol desde la API:', err);
      }
    }

    const userPermissions = isSuperAdmin
      ? ALL_PWA_PERMISSIONS_LIST
      : (dynamicPermissions.length > 0 ? dynamicPermissions : []);

    const userModules = isSuperAdmin
      ? ALL_PWA_MODULES_LIST
      : (response.modules || []);

    const session: UserSession = {
      userId,
      userRoleId: roleId,
      username,
      fullName,
      roleName,
      isAdmin: isAdminUser,
      isSuperAdmin,
      companyId: response.companyId,
      companyName: response.companyName,
      maxBranches: response.maxBranches,
      token: response.token,
      permissions: userPermissions,
      modules: userModules,
      branches: response.branches || [],
    };

    localStorage.setItem('auth_user', JSON.stringify(session));

    return session;
  },

  logout: async (): Promise<void> => {
    // Purgar credenciales y sesión inmediatamente para evitar rebotes de navegación
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    try {
      await apiClient.post('/Auth/logout');
    } catch {
      // Ignoramos errores de red en logout
    }
  },

  getCurrentUser: (): UserSession | null => {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson) as UserSession;
      const isSuperAdmin = Boolean(user.isSuperAdmin);
      const isAdmin = Boolean(user.isAdmin || isSuperAdmin);

      if (isSuperAdmin) {
        user.isSuperAdmin = true;
        user.isAdmin = true;
        user.permissions = ALL_PWA_PERMISSIONS_LIST;
        user.modules = ALL_PWA_MODULES_LIST;
      } else {
        user.isSuperAdmin = false;
        user.isAdmin = isAdmin;
      }
      return user;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem('auth_token'));
  },

  hasPermission: (permissionSlug: string): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.isSuperAdmin) {
      return true;
    }
    if (!user.permissions || !Array.isArray(user.permissions)) return false;

    if (user.permissions.includes(permissionSlug)) return true;

    // Aliases bidireccionales de compatibilidad entre UI y base de datos (02_Init_RBAC_Seed.sql)
    const aliases: Record<string, string[]> = {
      // 1. Dashboard (Módulo 6 - analytics.view_dashboard)
      'dashboard.view': ['analytics.view_dashboard', 'analytics.metrics'],
      'analytics.view_dashboard': ['dashboard.view'],

      // 2. Cobro / Caja / Turnos (Módulos 2 & 5 - checkout.view, shifts.view_current)
      'checkout.view': ['checkout.process_payment'],
      'checkout.process_payment': ['checkout.view'],
      'shift.view': ['shifts.view_current', 'shifts.view_history', 'shifts.open'],
      'shifts.view_current': ['shift.view'],
      'shift.close': ['shifts.close'],
      'shifts.close': ['shift.close'],
      'shift.open': ['shifts.open'],
      'shifts.open': ['shift.open'],
      'shifts.blind_count': ['shift.blind_count', 'shift.cash_withdrawal'],
      'shift.cash_withdrawal': ['shifts.blind_count'],
      'shifts.view_history': ['shift.history'],
      'shift.history': ['shifts.view_history'],
      'shifts.reprint_closure': ['shift.reprint', 'shift.export'],
      'shift.export': ['shifts.reprint_closure'],

      // 3. Activos / Patio / Ingreso (Módulos 1 & 4 - monitoring.view_occupancy, checkin.view, checkin.create)
      'recent_entries.view': ['monitoring.view_occupancy', 'monitoring.search_vehicles', 'checkin.view', 'checkin.create', 'monitoring.force_exit', 'monitoring.export'],
      'monitoring.view_occupancy': ['recent_entries.view', 'checkin.view'],
      'monitoring.search_vehicles': ['recent_entries.view', 'checkin.view'],
      'monitoring.force_exit': ['recent_entries.force_exit'],
      'monitoring.export': ['recent_entries.export'],
      'checkin.view': ['recent_entries.view', 'monitoring.view_occupancy', 'checkin.create_ticket'],
      'checkin.create_ticket': ['checkin.create', 'checkin.view'],
      'checkin.create': ['recent_entries.view', 'checkin.view', 'checkin.create_ticket'],

      // 4. Reportes (Módulo 6 - analytics.income_reports, analytics.occupancy_reports, analytics.audit_reports, analytics.export)
      'reports.view': ['analytics.income_reports', 'analytics.occupancy_reports', 'analytics.audit_reports', 'analytics.export'],
      'analytics.income_reports': ['reports.view'],
      'analytics.occupancy_reports': ['reports.view'],
      'analytics.audit_reports': ['reports.view'],
      'analytics.export': ['reports.view'],

      // 5. Novedades (Módulo 15 - novedades.view)
      'novedades.view': ['novedades.create', 'novedades.edit', 'novedades.resolve'],

      // 6. Sedes / Parqueaderos (Módulo 7 - branches.view)
      'settings.parqueaderos.view': ['branches.view'],
      'branches.view': ['settings.parqueaderos.view'],
      'settings.parqueaderos.manage': ['branches.create', 'branches.edit', 'branches.delete', 'branches.assign_users'],

      // 7. Tarifas y Tipos de Vehículos (Módulo 8 - rates.view)
      'settings.tarifas.view': ['rates.view'],
      'settings.vehiculos.view': ['rates.view'],
      'rates.view': ['settings.tarifas.view', 'settings.vehiculos.view'],
      'settings.tarifas.manage': ['rates.create', 'rates.edit', 'rates.delete'],
      'settings.vehiculos.manage': ['rates.create', 'rates.edit', 'rates.delete'],

      // 8. Medios de Pago (Módulo 9 - payment_methods.view)
      'settings.medios_pago.view': ['payment_methods.view'],
      'payment_methods.view': ['settings.medios_pago.view'],
      'settings.medios_pago.manage': ['payment_methods.create', 'payment_methods.edit', 'payment_methods.delete'],

      // 9. Convenios (Módulo 10 - agreements.view)
      'settings.convenios.view': ['agreements.view'],
      'agreements.view': ['settings.convenios.view'],
      'settings.convenios.manage': ['agreements.create', 'agreements.edit', 'agreements.delete'],

      // 10. Usuarios y Roles (Módulos 11 & 12 - users.view, roles.view, permissions.view)
      'settings.usuarios.view': ['users.view'],
      'users.view': ['settings.usuarios.view'],
      'settings.usuarios.manage': ['users.create', 'users.edit', 'users.delete'],
      'settings.roles.view': ['roles.view', 'permissions.view'],
      'roles.view': ['settings.roles.view'],
      'permissions.view': ['settings.roles.view'],
      'settings.roles.manage': ['roles.create', 'roles.edit', 'permissions.assign'],

      // 11. Resoluciones (Módulo 14 - resolutions.view)
      'settings.resoluciones.view': ['resolutions.view'],
      'resolutions.view': ['settings.resoluciones.view'],
      'settings.resoluciones.manage': ['resolutions.create', 'resolutions.edit', 'resolutions.delete'],
    };

    const targetAliases = aliases[permissionSlug];
    if (targetAliases && targetAliases.some((alias) => user.permissions.includes(alias))) {
      return true;
    }

    return false;
  },

  hasModule: (moduleSlug: string): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.isSuperAdmin) {
      return true;
    }
    return user.modules ? user.modules.includes(moduleSlug) : false;
  },
};
