import React, { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { apiGet, apiPost } from '../api/client';
import type { User } from '@watchly/shared';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface TokenPayload {
  userId: string;
  exp: number;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      let token = localStorage.getItem('watchly_access_token');
      const refreshToken = localStorage.getItem('watchly_refresh_token');

      if (!token && !refreshToken) {
        setLoading(false);
        return;
      }

      try {
        let decoded = token ? jwtDecode<TokenPayload>(token) : null;
        let activeUserId = decoded?.userId;

        // If access token is expired or missing but we have a refresh token, try to refresh
        if ((!decoded || decoded.exp * 1000 < Date.now()) && refreshToken) {
          const refreshData = await apiPost<RefreshResponse>('/auth/refresh', { refreshToken });

          token = refreshData.accessToken;
          localStorage.setItem('watchly_access_token', refreshData.accessToken);
          localStorage.setItem('watchly_refresh_token', refreshData.refreshToken);

          decoded = jwtDecode<TokenPayload>(token);
          activeUserId = decoded.userId;
        } else if (!decoded || decoded.exp * 1000 < Date.now()) {
          throw new Error('Tokens expired and no valid refresh token available.');
        }

        // Fetch fresh user profile using the valid/refreshed access token
        const userData = await apiGet<User>(`/users/${activeUserId}`);
        setUser(userData);
      } catch (err) {
        console.error('Failed to restore or refresh session', err);
        localStorage.removeItem('watchly_access_token');
        localStorage.removeItem('watchly_refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('watchly_access_token', accessToken);
    localStorage.setItem('watchly_refresh_token', refreshToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('watchly_access_token');
    localStorage.removeItem('watchly_refresh_token');
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}