export interface AuthRequestDto {
  username: string;
  password: string;
}

export interface AuthResponseDto {
  success: boolean;
  token?: string;
  errorMessage?: string;
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
  isAdmin: boolean;
}

export interface UserSession {
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
  isAdmin: boolean;
  token: string;
}
