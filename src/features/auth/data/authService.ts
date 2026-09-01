import { apiClient } from '../../../shared/api/apiClient';
import type { AuthRequestDto, AuthResponseDto, UserSession, ActionRoleDto } from '../model/AuthContracts';
import { ALL_PWA_PERMISSIONS_LIST, ALL_PWA_MODULES_LIST } from '../../../shared/auth/rbacConstants';

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined') {
  try {
    const rbacChannel = new BroadcastChannel('parkflow_rbac_sync');
    rbacChannel.onmessage = (event) => {
      if (event.data?.type === 'REFRESH_PERMISSIONS') {
        authService.refreshSession().catch(() => {});
      }
    };
  } catch {}
}

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
    authService.notifySessionChanged();

    return session;
  },

  notifySessionChanged: (): void => {
    try {
      window.dispatchEvent(new CustomEvent('parkflow:session_updated', { detail: authService.getCurrentUser() }));
    } catch {}
  },

  broadcastPermissionsChanged: (): void => {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('parkflow_rbac_sync');
        bc.postMessage({ type: 'REFRESH_PERMISSIONS', timestamp: Date.now() });
        bc.close();
      }
      authService.notifySessionChanged();
    } catch {}
  },

  refreshSession: async (): Promise<UserSession | null> => {
    if (!authService.isAuthenticated()) return null;
    try {
      const response = await apiClient.get<any>('/Auth/validate-session');
      if (response && response.valid) {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) return null;

        const isSuperAdmin = Boolean(response.isSuperAdmin);
        const isAdminUser = Boolean(response.isAdmin || isSuperAdmin);
        const permissions = isSuperAdmin
          ? ALL_PWA_PERMISSIONS_LIST
          : (Array.isArray(response.permissions) ? response.permissions : currentUser.permissions);

        const updatedSession: UserSession = {
          ...currentUser,
          roleName: response.roleName || currentUser.roleName,
          userRoleId: response.roleId ?? currentUser.userRoleId,
          fullName: response.fullName || currentUser.fullName,
          companyName: response.companyName || currentUser.companyName,
          companyId: response.companyId ?? currentUser.companyId,
          maxBranches: response.maxBranches ?? currentUser.maxBranches,
          branches: response.branches ?? currentUser.branches,
          isAdmin: isAdminUser,
          isSuperAdmin,
          permissions,
        };

        const prevPermsStr = JSON.stringify(currentUser.permissions || []);
        const nextPermsStr = JSON.stringify(updatedSession.permissions || []);

        localStorage.setItem('auth_user', JSON.stringify(updatedSession));

        if (prevPermsStr !== nextPermsStr) {
          authService.notifySessionChanged();
        }

        return updatedSession;
      }
      return null;
    } catch {
      return null;
    }
  },

  logout: async (): Promise<void> => {
    // Purgar credenciales y sesión inmediatamente para evitar rebotes de navegación
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    authService.notifySessionChanged();

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

    // Aliases bidireccionales y específicos de granularidad fina entre UI y base de datos (02_Init_RBAC_Seed.sql)
    const aliases: Record<string, string[]> = {
      // 1. Dashboard (Módulo 6 - analytics.view_dashboard)
      'dashboard.view': ['analytics.view_dashboard', 'analytics.metrics'],
      'analytics.view_dashboard': ['dashboard.view'],

      // 2. Cobro / Caja / Turnos (Módulos 2 & 5)
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

      // 3. Activos / Patio / Ingreso (Módulos 1 & 4)
      'recent_entries.view': ['monitoring.view_occupancy', 'monitoring.search_vehicles', 'checkin.view', 'checkin.create'],
      'monitoring.view_occupancy': ['recent_entries.view'],
      'monitoring.search_vehicles': ['recent_entries.view'],
      'monitoring.force_exit': ['recent_entries.force_exit'],
      'monitoring.export': ['recent_entries.export'],
      'checkin.view': ['recent_entries.view', 'checkin.create'],
      'checkin.create_ticket': ['checkin.create'],
      'checkin.create': ['checkin.create_ticket'],

      // 4. Reportes (Módulo 6)
      'reports.view': ['analytics.income_reports', 'analytics.occupancy_reports', 'analytics.audit_reports', 'analytics.export'],
      'analytics.income_reports': ['reports.view'],
      'analytics.occupancy_reports': ['reports.view'],
      'analytics.audit_reports': ['reports.view'],
      'analytics.export': ['reports.view', 'reports.export'],
      'reports.export': ['analytics.export'],

      // 5. Novedades (Módulo 15)
      'novedades.view': ['novedades.view', 'novedades.create', 'novedades.edit', 'novedades.resolve'],
      'novedades.create': ['novedades.create'],
      'novedades.edit': ['novedades.edit'],
      'novedades.resolve': ['novedades.resolve'],

      // 6. Sedes / Parqueaderos (Módulo 7)
      'settings.parqueaderos.view': ['branches.view'],
      'branches.view': ['settings.parqueaderos.view'],
      'branches.create': ['settings.parqueaderos.create'],
      'branches.edit': ['settings.parqueaderos.edit'],
      'branches.delete': ['settings.parqueaderos.delete'],
      'branches.assign_users': ['settings.parqueaderos.assign_users'],

      // 7. Tarifas y Tipos de Vehículos (Módulo 8)
      'settings.tarifas.view': ['rates.view'],
      'settings.vehiculos.view': ['rates.view'],
      'rates.view': ['settings.tarifas.view', 'settings.vehiculos.view'],
      'rates.create': ['settings.tarifas.create', 'settings.vehiculos.create'],
      'rates.edit': ['settings.tarifas.edit', 'settings.vehiculos.edit'],
      'rates.delete': ['settings.tarifas.delete', 'settings.vehiculos.delete'],

      // 8. Medios de Pago (Módulo 9)
      'settings.medios_pago.view': ['payment_methods.view'],
      'payment_methods.view': ['settings.medios_pago.view'],
      'payment_methods.create': ['settings.medios_pago.create'],
      'payment_methods.edit': ['settings.medios_pago.edit'],
      'payment_methods.delete': ['settings.medios_pago.delete'],

      // 9. Convenios (Módulo 10)
      'settings.convenios.view': ['agreements.view'],
      'agreements.view': ['settings.convenios.view'],
      'agreements.create': ['settings.convenios.create'],
      'agreements.edit': ['settings.convenios.edit'],
      'agreements.delete': ['settings.convenios.delete'],

      // 10. Usuarios y Roles (Módulos 11 & 12)
      'settings.usuarios.view': ['users.view'],
      'users.view': ['settings.usuarios.view'],
      'users.create': ['settings.usuarios.create'],
      'users.edit': ['settings.usuarios.edit'],
      'users.delete': ['settings.usuarios.delete'],

      'settings.roles.view': ['roles.view', 'permissions.view'],
      'roles.view': ['settings.roles.view'],
      'roles.create': ['settings.roles.create'],
      'roles.edit': ['settings.roles.edit'],
      'roles.delete': ['settings.roles.delete'],
      'permissions.view': ['settings.roles.view'],
      'permissions.assign': ['settings.roles.manage', 'settings.permissions.assign'],

      // 11. Resoluciones (Módulo 14)
      'settings.resoluciones.view': ['resolutions.view'],
      'resolutions.view': ['settings.resoluciones.view'],
      'resolutions.create': ['settings.resoluciones.create'],
      'resolutions.edit': ['settings.resoluciones.edit'],
      'resolutions.delete': ['settings.resoluciones.delete'],
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
