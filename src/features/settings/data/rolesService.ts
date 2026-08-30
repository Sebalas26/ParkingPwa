import { apiClient } from '../../../shared/api/apiClient';
import type { RoleDto, SaveRoleDto, ActionDto, ModuleDto, RoleActionPermissionDto } from '../model/RolesContracts';

export const rolesService = {
  getRoles: async (companyId?: number): Promise<RoleDto[]> => {
    try {
      const url = companyId ? `/UserRole/GetUsersRoles?companyId=${companyId}` : '/UserRole/GetUsersRoles';
      const data = await apiClient.get<any[]>(url);
      if (data && Array.isArray(data) && data.length > 0) {
        return data.map((r) => {
          const roleId = r.idUserRol ?? r.IdUserRol ?? r.id ?? r.Id ?? 1;
          const roleName = r.roleName ?? r.RoleName ?? r.role ?? r.Role ?? r.name ?? r.Name ?? 'Rol';
          return {
            idUserRol: roleId,
            id: roleId,
            roleName,
            role: roleName,
            name: roleName,
            isActive: r.isActive ?? r.IsActive ?? true,
            createdAt: r.createdAt ?? r.CreatedAt,
            updatedAt: r.updatedAt ?? r.UpdatedAt,
          };
        });
      }
      return [];
    } catch (err) {
      console.error('Error al obtener roles:', err);
      return [];
    }
  },

  getRoleById: async (id: number): Promise<RoleDto | null> => {
    try {
      const data = await apiClient.get<any>(`/UserRole/GetUserRole/${id}`);
      if (data) {
        const roleId = data.idUserRol ?? data.IdUserRol ?? data.id ?? data.Id ?? id;
        const roleName = data.roleName ?? data.RoleName ?? data.role ?? data.Role ?? data.name ?? 'Rol';
        return {
          idUserRol: roleId,
          id: roleId,
          roleName,
          role: roleName,
          name: roleName,
          isActive: data.isActive ?? data.IsActive ?? true,
        };
      }
      return null;
    } catch (err) {
      console.error(`Error al obtener rol #${id}:`, err);
      return null;
    }
  },

  saveOrEditRole: async (role: SaveRoleDto & { companyId?: number }): Promise<boolean> => {
    const payload = {
      idUserRol: role.idUserRol,
      roleName: role.roleName,
      isActive: role.isActive,
      companyId: role.companyId,
    };
    await apiClient.post('/UserRole/SaveOrEditUserRole', payload);
    return true;
  },

  getModules: async (): Promise<ModuleDto[]> => {
    try {
      const data = await apiClient.get<any[]>('/Module/GetModules');
      if (data && Array.isArray(data)) {
        return data.map((m) => ({
          id: m.id ?? m.Id,
          name: m.name ?? m.Name,
          isActive: m.isActive ?? m.IsActive ?? true,
        }));
      }
      return [];
    } catch (err) {
      console.error('Error al obtener módulos:', err);
      return [];
    }
  },

  getActions: async (): Promise<ActionDto[]> => {
    try {
      const data = await apiClient.get<any[]>('/Actions/GetActions');
      if (data && Array.isArray(data)) {
        return data.map((a) => ({
          id: a.id ?? a.Id,
          name: a.name ?? a.Name,
          slug: a.slug ?? a.Slug,
          moduleId: a.module?.id ?? a.module?.Id ?? a.moduleId ?? a.ModuleId,
          module: a.module ? { id: a.module.id ?? a.module.Id, name: a.module.name ?? a.module.Name, isActive: a.module.isActive ?? true } : undefined,
          operationId: a.operation?.id ?? a.operation?.Id ?? a.operationId ?? a.OperationId,
          operation: a.operation ? { id: a.operation.id ?? a.operation.Id, name: a.operation.name ?? a.operation.Name, isActive: a.operation.isActive ?? true } : undefined,
          isActive: a.isActive ?? a.IsActive ?? true,
        }));
      }
      return [];
    } catch (err) {
      console.error('Error al obtener acciones/permisos:', err);
      return [];
    }
  },

  getRolePermissions: async (roleId: number): Promise<RoleActionPermissionDto[]> => {
    try {
      const data = await apiClient.get<any[]>(`/RoleActions/PermissionRole/${roleId}`);
      if (data && Array.isArray(data)) {
        return data.map((p) => ({
          actionId: p.actionId ?? p.ActionId,
          isActive: p.isActive ?? p.IsActive ?? true,
          moduleId: p.moduleId ?? p.ModuleId,
          actionName: p.actionName ?? p.ActionName,
        }));
      }
      return [];
    } catch (err) {
      console.error(`Error al obtener permisos para el rol ${roleId}:`, err);
      return [];
    }
  },

  assignRolePermissions: async (roleId: number, actionIds: number[]): Promise<boolean> => {
    await apiClient.post('/RoleActions/AssignRolePermissions', {
      roleId,
      actionIds,
    });
    return true;
  },

  deleteRole: async (roleId: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/UserRole/DeleteUserRole/${roleId}`);
      return true;
    } catch {
      try {
        await apiClient.delete(`/UserRole/${roleId}`);
        return true;
      } catch (err: any) {
        throw new Error(err?.message || 'Error al eliminar el rol.');
      }
    }
  },
};
