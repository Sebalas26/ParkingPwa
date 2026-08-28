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

    // Aliases bidireccionales de compatibilidad entre UI y base de datos
    const aliases: Record<string, string[]> = {
      'dashboard.view': ['analytics.view', 'analytics.metrics', 'analytics.view_dashboard'],
      'settings.parqueaderos.view': ['branches.view'],
      'settings.parqueaderos.manage': ['branches.create', 'branches.edit', 'branches.delete', 'branches.assign_users'],
      'settings.usuarios.view': ['users.view'],
      'settings.usuarios.manage': ['users.create', 'users.edit', 'users.delete'],
      'settings.roles.view': ['roles.view', 'permissions.view'],
      'settings.roles.manage': ['roles.create', 'roles.edit', 'permissions.assign'],
      'settings.tarifas.view': ['rates.view'],
      'settings.tarifas.manage': ['rates.create', 'rates.edit', 'rates.delete'],
      'settings.convenios.view': ['agreements.view'],
      'settings.convenios.manage': ['agreements.create', 'agreements.edit', 'agreements.delete'],
      'settings.medios_pago.view': ['payment_methods.view'],
      'settings.medios_pago.manage': ['payment_methods.create', 'payment_methods.edit', 'payment_methods.delete'],
      'reports.view': ['analytics.view', 'analytics.export', 'shift.export', 'analytics.income_reports', 'analytics.occupancy_reports', 'analytics.audit_reports'],
      'novedades.view': ['recent_entries.view'],
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
