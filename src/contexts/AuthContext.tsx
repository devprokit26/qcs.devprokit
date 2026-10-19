import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, PageKey } from '@/models/types';
import { authService } from '@/services';
import toast from 'react-hot-toast';
import { canAccessPage } from '@/utils/permissions';

interface AuthContextValue {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginError: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hasPermission: (page: PageKey) => boolean;
  resetDemoData: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      // Only update state if we got a definitive answer.
      // getCurrentUser returns the cached user on NetworkError/ServerError,
      // so we set whatever was returned (could be cached user or null for AuthError / no token).
      setCurrentUser(user);
    } catch {
      // Unexpected error — do NOT clear the user (could be a transient issue)
      // setCurrentUser(null) is intentionally omitted here
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setLoginError(null);
      const user = await authService.login(username, password);
      setCurrentUser(user);
      toast.success(`Welcome back, ${user.name}!`);
      return true;
    } catch (err: unknown) {
      // Shown inline on the login form (wrong password, offline, server down ...)
      setLoginError(err instanceof Error && err.message ? err.message : 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setCurrentUser(null);
      toast.success('Logged out successfully');
      // Force full page navigation — clears all React state across every component
      window.location.replace('/login');
    } catch {
      toast.error('Logout error');
    }
  };

  const hasPermission = (page: PageKey): boolean => {
    return canAccessPage(currentUser, page);
  };

  const resetDemoData = async () => {
    try {
      await authService.resetDemoData();
      toast.success('Demo data restored to initial state');
      window.location.reload();
    } catch {
      toast.error('Failed to reset demo data');
    }
  };

  const value: AuthContextValue = {
    currentUser,
    isAuthenticated: !!currentUser,
    loading,
    loginError,
    login,
    logout,
    hasPermission,
    resetDemoData,
    refreshUser: checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Single shared hook — all callers see the same auth state */
export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside <AuthProvider>');
  return ctx;
}
