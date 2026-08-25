import { apiClient } from '../../../shared/api/apiClient';
import type { AuthRequestDto, AuthResponseDto, UserSession, ActionRoleDto } from '../model/AuthContracts';
import { ALL_PWA_PERMISSIONS_LIST, ALL_PWA_MODULES_LIST } from '../../../shared/auth/rbacConstants';

export const authService = {
  login: async (credentials: AuthRequestDto): Promise<UserSession> => {
    const response = await apiClient.post<AuthResponseDto>('/Auth/authenticate', credentials);

    if (!response || !response.token) {
      throw new Error(response?.errorMessage || response?.message || 'No se pudo obtener el token de autenticación.');
    }

    const userId = response.idUser ?? response.userId ?? 1;
    const roleId = response.idRoleUser ?? response.userRoleId ?? (credentials.username.toLowerCase() === 'admin' ? 1 : 2);
    const fullName = response.fullname || response.fullName || credentials.username;
    const username = response.username || credentials.username;

    const isAdminUser = roleId === 1 ||
      username.toLowerCase() === 'admin' ||
      credentials.username.toLowerCase() === 'admin' ||
      response.roleName === 'Administrador' ||
      Boolean(response.isAdmin);

    const roleName = response.roleName || (isAdminUser ? 'Administrador' : roleId === 2 ? 'Operador' : 'Usuario');

    // Guardar temporalmente el token para poder llamar a RoleActions
    localStorage.setItem('auth_token', response.token);

    // Consultar permisos reales del rol desde la API
    let dynamicPermissions: string[] = [];
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

    const userPermissions = isAdminUser
      ? ALL_PWA_PERMISSIONS_LIST
      : (dynamicPermissions.length > 0 ? dynamicPermissions : (response.permissions || []));

    const userModules = isAdminUser
      ? ALL_PWA_MODULES_LIST
      : (response.modules || []);

    const session: UserSession = {
      userId,
      userRoleId: roleId,
      username,
      fullName,
      roleName,
      isAdmin: isAdminUser,
      token: response.token,
      permissions: userPermissions,
      modules: userModules,
      branches: response.branches || [],
    };

    localStorage.setItem('auth_user', JSON.stringify(session));

    return session;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/Auth/logout');
    } catch {
      // Ignoramos errores de red en logout
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
  },

  getCurrentUser: (): UserSession | null => {
    const userJson = localStorage.getItem('auth_user');
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson) as UserSession;
      const isAdmin = user.isAdmin ||
        user.userRoleId === 1 ||
        user.roleName === 'Administrador' ||
        user.username?.toLowerCase() === 'admin';

      if (isAdmin) {
        user.isAdmin = true;
        user.roleName = 'Administrador';
        user.permissions = ALL_PWA_PERMISSIONS_LIST;
        user.modules = ALL_PWA_MODULES_LIST;
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
    if (user.isAdmin || user.userRoleId === 1 || user.roleName === 'Administrador' || user.username?.toLowerCase() === 'admin') {
      return true;
    }
    return user.permissions ? user.permissions.includes(permissionSlug) : false;
  },

  hasModule: (moduleSlug: string): boolean => {
    const user = authService.getCurrentUser();
    if (!user) return false;
    if (user.isAdmin || user.userRoleId === 1 || user.roleName === 'Administrador' || user.username?.toLowerCase() === 'admin') {
      return true;
    }
    return user.modules ? user.modules.includes(moduleSlug) : false;
  },
};
