'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  fullNameEn: string;
  fullNameKh?: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  department?: string;
  telegramUsername?: string;
  bio?: string;
  notificationsEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
  updateUserLocal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('clinic_access_token');
      localStorage.removeItem('clinic_user');
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const verifiedUser = await api.users.getProfile().catch(() => api.auth.me());
      if (verifiedUser && verifiedUser.id) {
        setUser(verifiedUser);
        setToken(savedToken);
        localStorage.setItem('clinic_user', JSON.stringify(verifiedUser));
      } else {
        logout();
      }
    } catch {
      // If server unreachable or token invalid, clear
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const updateUserLocal = useCallback((updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      try {
        localStorage.setItem('clinic_user', JSON.stringify(merged));
      } catch {}
      return merged;
    });
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, pass: string) => {
    const res = await api.auth.login({ email, password: pass });
    if (!res || !res.accessToken || !res.user) {
      throw new Error('Invalid credentials');
    }
    localStorage.setItem('clinic_access_token', res.accessToken);
    localStorage.setItem('clinic_user', JSON.stringify(res.user));
    setToken(res.accessToken);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
