export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  authProvider: 'email' | 'google';
  role: 'admin' | 'reader';
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}
