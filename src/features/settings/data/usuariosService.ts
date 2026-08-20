import { apiClient } from '../../../shared/api/apiClient';
import type { UserDto, SaveUserDto } from '../model/UsuariosContracts';

export const usuariosService = {
  getUsers: async (): Promise<UserDto[]> => {
    try {
      const data = await apiClient.get<UserDto[]>('/Users');
      return data || [];
    } catch {
      return [];
    }
  },

  getUserById: async (id: number): Promise<UserDto | null> => {
    return await apiClient.get<UserDto>(`/Users/${id}`);
  },

  saveOrEditUser: async (user: SaveUserDto): Promise<UserDto> => {
    return await apiClient.post<UserDto>('/Users/SaveOrEditUsers', user);
  },

  deactivateUser: async (id: number): Promise<boolean> => {
    try {
      await apiClient.delete(`/Users/${id}`);
      return true;
    } catch {
      return false;
    }
  },
};
