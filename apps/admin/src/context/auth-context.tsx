'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AdminUser, AuthState, LoginCredentials } from '../types/auth';
import {
  getCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  AuthError,
} from '../lib/auth-client';

interface AuthContextValue {
  user: AdminUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AdminUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<AdminUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    error: null,
  });

  const refresh = useCallback(async (): Promise<AdminUser | null> => {
    try {
      const user = await getCurrentUser();
      if (user) {
        setState({ status: 'authenticated', user, error: null });
        return user;
      }
      setState({ status: 'unauthenticated', user: null, error: null });
      return null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Session verification failed';
      setState({ status: 'unauthenticated', user: null, error: message });
      return null;
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AdminUser> => {
      setState({ status: 'loading', user: null, error: null });
      try {
        const user = await apiLogin(credentials);
        setState({ status: 'authenticated', user, error: null });
        return user;
      } catch (err) {
        const message =
          err instanceof AuthError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Authentication failed';
        setState({ status: 'unauthenticated', user: null, error: message });
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    await apiLogout();
    setState({ status: 'unauthenticated', user: null, error: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        status: state.status,
        error: state.error,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
