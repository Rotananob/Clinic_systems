'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { trackUserAction } from '../lib/tracker';

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
  tenantId?: string;
  tenant?: any;
  permissions?: string[];
  allowedRoutes?: string[];
  targetRoute?: string;
  isVerifiedRealRole?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserLocal: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: async () => ({ id: '', email: '', fullNameEn: '', role: '' }),
  logout: () => {},
  refreshProfile: async () => {},
  updateUserLocal: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize cached credentials from localStorage immediately on client mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('clinic_access_token');
      const savedUser = localStorage.getItem('clinic_user');
      if (savedToken) {
        setToken(savedToken);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      }
    } catch {}
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    trackUserAction('USER_LOGOUT');
    try {
      localStorage.removeItem('clinic_access_token');
      localStorage.removeItem('clinic_user');
      sessionStorage.clear();
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    setIsLoading(false);

    if (typeof window !== 'undefined') {
      // Lock history and replace location so browser back button cannot restore protected clinic pages
      window.history.pushState(null, '', '/login');
      window.location.replace('/login');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('clinic_access_token') : null;
    if (!savedToken) {
      setUser(null);
      setToken(null);
      setIsLoading(false);
      return;
    }

    // If device is offline, keep cached user session active without network roundtrip
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsLoading(false);
      return;
    }

    try {
      // Fast background verification with 2500ms timeout so clinical staff are never blocked
      const verifyWithTimeout = Promise.race([
        api.users.getProfile().catch(() => api.auth.me()),
        new Promise((_, reject) => setTimeout(() => reject(new Error('SESSION_VERIFY_TIMEOUT')), 2500)),
      ]);

      const verifiedUser: any = await verifyWithTimeout;
      if (verifiedUser && verifiedUser.id) {
        setUser(verifiedUser);
        setToken(savedToken);
        localStorage.setItem('clinic_user', JSON.stringify(verifiedUser));
      } else {
        logout();
      }
    } catch (err: any) {
      // Only terminate session if server explicitly returns 401 Unauthorized
      const isUnauthorized =
        err?.message?.includes('401') ||
        err?.message?.includes('Unauthorized') ||
        err?.message?.includes('jwt expired');

      if (isUnauthorized) {
        logout();
      } else {
        // Network timeout / connection error: retain cached session so clinic operations continue smoothly
        try {
          const savedUser = localStorage.getItem('clinic_user');
          if (savedUser) {
            setUser(JSON.parse(savedUser));
            setToken(savedToken);
          }
        } catch {}
      }
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
    try {
      // Offline login fallback if network is unreachable
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const savedUserStr = localStorage.getItem('clinic_user');
        if (savedUserStr) {
          const cachedUser = JSON.parse(savedUserStr);
          if (cachedUser.email?.toLowerCase() === email.toLowerCase()) {
            setUser(cachedUser);
            setToken(localStorage.getItem('clinic_access_token') || 'offline-token');
            return cachedUser;
          }
        }
        throw new Error('No internet connection. Please connect to your network to log in.');
      }

      const res = await api.auth.login({ email, password: pass });
      if (!res || !res.accessToken || !res.user) {
        trackUserAction('USER_LOGIN_FAILED', { email });
        throw new Error('Invalid credentials');
      }

      const userWithPermissions: User = {
        ...res.user,
        targetRoute: (res as any).targetRoute,
        permissions: (res as any).permissions,
        allowedRoutes: (res as any).allowedRoutes,
        isVerifiedRealRole: true,
      };

      localStorage.setItem('clinic_access_token', res.accessToken);
      localStorage.setItem('clinic_user', JSON.stringify(userWithPermissions));
      setToken(res.accessToken);
      setUser(userWithPermissions);
      trackUserAction('USER_LOGIN', {
        email: userWithPermissions.email,
        role: userWithPermissions.role,
        name: userWithPermissions.fullNameKh || userWithPermissions.fullNameEn,
      });

      return userWithPermissions;
    } catch (err) {
      trackUserAction('USER_LOGIN_FAILED', { email });
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, refreshProfile, updateUserLocal }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
