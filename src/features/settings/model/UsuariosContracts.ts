export interface UserRoleDto {
  id: number;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UserDto {
  id: number;
  name?: string;
  fullName?: string;
  username?: string;
  email: string;
  role?: string;
  userRoleDto?: UserRoleDto;
  status?: string | boolean;
  isActive?: boolean;
  password?: string;
  lastLogin?: string;
}

export interface SaveUserDto {
  id?: number;
  name?: string;
  fullName?: string;
  email: string;
  role?: string;
  userRoleId?: number;
  status?: string | boolean;
  isActive?: boolean;
  username?: string;
  password?: string;
}
