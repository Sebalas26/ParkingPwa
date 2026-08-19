export interface User {
  id: string;
  username: string;
  role: 'admin' | 'attendant';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}
