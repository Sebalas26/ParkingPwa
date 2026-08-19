import type { User } from '../model/AuthTypes';

// Mock authentication service with hardcoded credentials
export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    if (username === 'admin' && password === 'admin123') {
      const user: User = { id: '1', username: 'admin', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    
    throw new Error('Invalid credentials');
  },

  logout: (): void => {
    localStorage.removeItem('user');
  },

  getCurrentUser: (): User | null => {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }
};
