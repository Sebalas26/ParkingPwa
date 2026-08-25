export interface RoleDto {
  idUserRol?: number;
  id?: number;
  roleName?: string;
  role?: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveRoleDto {
  idUserRol?: number;
  roleName: string;
  isActive: boolean;
}

export interface ModuleDto {
  id: number;
  name: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OperationDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface ActionDto {
  id: number;
  name: string;
  slug: string;
  moduleId?: number;
  module?: ModuleDto;
  operationId?: number;
  operation?: OperationDto;
  isActive: boolean;
  createdAt?: string;
}

export interface RoleActionPermissionDto {
  actionId: number;
  isActive: boolean;
  moduleId?: number;
  actionName?: string;
}

export interface AssignRolePermissionsDto {
  roleId: number;
  actionIds: number[];
}
