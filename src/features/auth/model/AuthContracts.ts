import type { BranchDto } from '../../settings/model/BranchesContracts';

export interface AuthRequestDto {
  username: string;
  password: string;
}

export interface ActionRoleDto {
  actionId: number;
  isActive: boolean;
  moduleId: number;
  actionName: string;
}

export interface AuthResponseDto {
  success?: boolean;
  token?: string;
  fullname?: string;
  fullName?: string;
  idUser?: number;
  userId?: string | number;
  idRoleUser?: number;
  userRoleId?: number;
  username?: string;
  roleName?: string;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  companyId?: number;
  companyName?: string;
  maxBranches?: number;
  errorMessage?: string;
  message?: string;
  permissions?: string[];
  modules?: string[];
  branches?: BranchDto[];
}

export interface UserSession {
  userId: string | number;
  userRoleId: number;
  username: string;
  fullName: string;
  roleName: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  companyId?: number;
  companyName?: string;
  maxBranches?: number;
  token: string;
  permissions: string[];
  modules: string[];
  branches?: BranchDto[];
}
