import { apiClient } from '../../../shared/api/apiClient';
import type { AuthRequestDto, AuthResponseDto, UserSession } from '../model/AuthContracts';

export const authService = {
  login: async (credentials: AuthRequestDto): Promise<UserSession> => {
    const response = await apiClient.post<AuthResponseDto>('/Auth/authenticate', credentials);

    if (!response || !response.token) {
      throw new Error(response?.errorMessage || 'No se pudo obtener el token de autenticación.');
    }

    const session: UserSession = {
      userId: response.userId,
      username: response.username,
      fullName: response.fullName || response.username,
      roleName: response.roleName || (response.isAdmin ? 'Administrador' : 'Operador'),
      isAdmin: Boolean(response.isAdmin),
      token: response.token,
    };

    localStorage.setItem('auth_token', session.token);
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
      return JSON.parse(userJson) as UserSession;
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return Boolean(localStorage.getItem('auth_token'));
  },
};
