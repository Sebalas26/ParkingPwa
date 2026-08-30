import { apiClient } from '../../../shared/api/apiClient';
import type { UserDto, SaveUserDto, GetIdentificationTypeDto, GetUserRoleDto } from '../model/UsuariosContracts';

export const usuariosService = {
  getUsers: async (companyId?: number): Promise<UserDto[]> => {
    try {
      const url = companyId ? `/Users/GetUsers?companyId=${companyId}` : '/Users/GetUsers';
      const data = await apiClient.get<UserDto[]>(url);
      return data || [];
    } catch {
      try {
        const urlFallback = companyId ? `/Users?companyId=${companyId}` : '/Users';
        const fallbackData = await apiClient.get<UserDto[]>(urlFallback);
        return fallbackData || [];
      } catch {
        return [];
      }
    }
  },

  getUsuarios: async (companyId?: number): Promise<UserDto[]> => {
    return await usuariosService.getUsers(companyId);
  },

  getIdentificationTypes: async (): Promise<GetIdentificationTypeDto[]> => {
    try {
      const data = await apiClient.get<any[]>('/IdentificationTypes/GetIdentificationTypesActive');
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map((t) => ({
          id: t.id ?? t.Id ?? 1,
          name: t.name || t.Name || t.identification || t.Identification || 'CC',
          identification: t.identification || t.Identification || t.name || t.Name || 'CC',
          isActive: t.isActive ?? t.IsActive ?? true,
        }));
      }
      const fallback = await apiClient.get<any[]>('/IdentificationTypes');
      if (fallback && Array.isArray(fallback) && fallback.length > 0) {
        return fallback.map((t) => ({
          id: t.id ?? t.Id ?? 1,
          name: t.name || t.Name || t.identification || t.Identification || 'CC',
          identification: t.identification || t.Identification || t.name || t.Name || 'CC',
          isActive: t.isActive ?? t.IsActive ?? true,
        }));
      }
      return [
        { id: 1, name: 'CC', identification: 'CC', isActive: true },
        { id: 2, name: 'CE', identification: 'CE', isActive: true },
        { id: 3, name: 'NIT', identification: 'NIT', isActive: true },
        { id: 4, name: 'PAS', identification: 'PAS', isActive: true },
        { id: 5, name: 'PEP', identification: 'PEP', isActive: true },
      ];
    } catch {
      return [
        { id: 1, name: 'CC', identification: 'CC', isActive: true },
        { id: 2, name: 'CE', identification: 'CE', isActive: true },
        { id: 3, name: 'NIT', identification: 'NIT', isActive: true },
        { id: 4, name: 'PAS', identification: 'PAS', isActive: true },
        { id: 5, name: 'PEP', identification: 'PEP', isActive: true },
      ];
    }
  },

  getUserRoles: async (companyId?: number): Promise<GetUserRoleDto[]> => {
    try {
      const url = companyId ? `/UserRole/GetUsersRoles?companyId=${companyId}` : '/UserRole/GetUsersRoles';
      const data = await apiClient.get<any[]>(url);
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map((r) => {
          const roleId = r.idUserRol ?? r.IdUserRol ?? r.id ?? r.Id ?? 2;
          const roleName = r.roleName ?? r.RoleName ?? r.role ?? r.Role ?? r.name ?? r.Name ?? 'Operador';
          return {
            idUserRol: roleId,
            roleName,
            id: roleId,
            role: roleName,
            name: roleName,
            isActive: r.isActive ?? r.IsActive ?? true,
          };
        });
      }
      const urlFallback = companyId ? `/UserRole?companyId=${companyId}` : '/UserRole';
      const fallback = await apiClient.get<any[]>(urlFallback);
      if (fallback && Array.isArray(fallback) && fallback.length > 0) {
        return fallback.map((r) => {
          const roleId = r.idUserRol ?? r.IdUserRol ?? r.id ?? r.Id ?? 2;
          const roleName = r.roleName ?? r.RoleName ?? r.role ?? r.Role ?? r.name ?? r.Name ?? 'Operador';
          return {
            idUserRol: roleId,
            roleName,
            id: roleId,
            role: roleName,
            name: roleName,
            isActive: r.isActive ?? r.IsActive ?? true,
          };
        });
      }
      return [
        { idUserRol: 1, id: 1, roleName: 'Administrador', role: 'Administrador', name: 'Administrador', isActive: true },
        { idUserRol: 2, id: 2, roleName: 'Operador', role: 'Operador', name: 'Operador', isActive: true },
        { idUserRol: 3, id: 3, roleName: 'Supervisor', role: 'Supervisor', name: 'Supervisor', isActive: true },
      ];
    } catch {
      return [
        { idUserRol: 1, id: 1, roleName: 'Administrador', role: 'Administrador', name: 'Administrador', isActive: true },
        { idUserRol: 2, id: 2, roleName: 'Operador', role: 'Operador', name: 'Operador', isActive: true },
        { idUserRol: 3, id: 3, roleName: 'Supervisor', role: 'Supervisor', name: 'Supervisor', isActive: true },
      ];
    }
  },

  getUserById: async (id: number): Promise<UserDto | null> => {
    return await apiClient.get<UserDto>(`/Users/${id}`);
  },

  saveOrEditUser: async (user: SaveUserDto): Promise<UserDto> => {
    return await apiClient.post<UserDto>('/Users/SaveOrEditUsers', user);
  },

  deleteUser: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/Users/${id}`);
      return true;
    } catch (err) {
      console.error('Error al eliminar usuario en API:', err);
      throw err;
    }
  },

  deactivateUser: async (id: number): Promise<boolean> => {
    return await usuariosService.deleteUser(id);
  },
};
