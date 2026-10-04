export interface User {
  id: string;
  email?: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
}

export interface VerifyRequest {
  token: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
