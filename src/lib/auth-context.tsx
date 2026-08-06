'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser, getToken, logout as apiLogout, UserSession } from './client-api';
import { useRouter, usePathname } from 'next/navigation';

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isAuthenticated: boolean;
  role: string | null;
  loading: boolean;
  logout: () => void;
  hasPermission: (allowedRoles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  role: null,
  loading: true,
  logout: () => {},
  hasPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const initializeAuth = () => {
      const storedUser = getStoredUser();
      const storedToken = getToken();

      if (storedUser && storedToken) {
        setUser(storedUser);
        setToken(storedToken);
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to storage changes in case of cross-tab logout
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'aiea_auth_token' || e.key === 'aiea_auth_user') {
        initializeAuth();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    setLoading(true);
    await apiLogout();
    setUser(null);
    setToken(null);
    setLoading(false);
    router.push('/login');
  };

  const hasPermission = (allowedRoles: string[]) => {
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  // Re-read auth state whenever pathname changes (catches post-login navigation)
  useEffect(() => {
    const storedUser = getStoredUser();
    const storedToken = getToken();
    if (storedUser && storedToken) {
      setUser(storedUser);
      setToken(storedToken);
    } else {
      setUser(null);
      setToken(null);
    }
    setLoading(false);
  }, [pathname]);

  // Route guarding — runs after auth state is resolved
  useEffect(() => {
    if (loading) return;

    const publicPaths = ['/login', '/register', '/terms-of-service', '/'];
    const isPublicPath = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
    const isAuthenticated = !!token;

    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login');
    } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
      router.replace('/dashboard');
    }
  }, [loading, pathname, token, router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        role: user?.role || null,
        loading,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
