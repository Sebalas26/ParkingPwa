export interface GetIdentificationTypeDto {
  id: number;
  name: string;
  identification?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetUserRoleDto {
  idUserRol: number;
  roleName: string;
  id?: number;
  role?: string;
  name?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserDto {
  id: number;
  userRoleId: number;
  identificationTypeId: number;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  firstSurname: string;
  secondLastName?: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  assignmentDate?: string | null;
  expirationDate?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  userRoleDto?: GetUserRoleDto;
  userRole?: GetUserRoleDto;
  identificationTypeDto?: GetIdentificationTypeDto;
  roleId?: number;
  idUser?: number;
  roleName?: string;
  roleDescription?: string;
  name?: string;
  role?: string;
  status?: string | boolean;
}

export interface SaveUserDto {
  id?: number;
  userRoleId: number;
  identificationTypeId: number;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  firstSurname: string;
  secondLastName?: string;
  fullName: string;
  username: string;
  password?: string;
  email: string;
  isActive: boolean;
  roleName?: string;
  name?: string;
  role?: string;
  status?: string | boolean;
}
