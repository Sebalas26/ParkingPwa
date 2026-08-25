import type { UserDto } from './UsuariosContracts';

export interface ModuleItemPermission {
  id: string | number;
  name: string;
  detail?: string;
}

export interface ItemizedPermissionsDto {
  tarifas: (string | number)[];
  usuarios: number[];
  convenios: (string | number)[];
  vehiculos?: string[];
  mediosPago: (string | number)[];
}

export interface ParqueaderoPermissionsDto {
  tarifas: boolean;
  usuarios: boolean;
  convenios: boolean;
  vehiculos?: boolean;
  mediosPago: boolean;
  itemized?: ItemizedPermissionsDto;
}

export interface ParqueaderoDto {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  isMainImage: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  enrolledUsers?: UserDto[];
  permissions?: ParqueaderoPermissionsDto;
  inheritedFromId?: number | null;
}

export interface SaveParqueaderoDto {
  id?: number;
  name: string;
  description: string;
  imageUrl: string;
  isMainImage: boolean;
  isActive: boolean;
  enrolledUserIds?: number[];
  permissions?: ParqueaderoPermissionsDto;
  inheritedFromId?: number | null;
}
