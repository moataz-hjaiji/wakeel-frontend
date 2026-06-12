import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { adminAuthStorage } from '../lib/admin-auth-storage';
import { adminAuthService } from '../services/admin.service';
import type { LoginPayload, SuperAdmin } from '../types/admin';

interface SuperAdminAuthContextValue {
  admin: SuperAdmin | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | null>(null);

export function SuperAdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<SuperAdmin | null>(() => adminAuthStorage.getAdmin());
  const [token, setToken] = useState<string | null>(() => adminAuthStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const savedToken = adminAuthStorage.getToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await adminAuthService.getMe(savedToken);
        setToken(savedToken);
        setAdmin(me);
        adminAuthStorage.setAdmin(me);
      } catch {
        adminAuthStorage.clear();
        setToken(null);
        setAdmin(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await adminAuthService.login(payload);
    adminAuthStorage.setToken(res.access_token);
    adminAuthStorage.setAdmin(res.admin);
    setToken(res.access_token);
    setAdmin(res.admin);
  }, []);

  const logout = useCallback(() => {
    adminAuthStorage.clear();
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({
      admin,
      token,
      isLoading,
      isAuthenticated: !!token && !!admin,
      login,
      logout,
    }),
    [admin, token, isLoading, login, logout],
  );

  return (
    <SuperAdminAuthContext.Provider value={value}>{children}</SuperAdminAuthContext.Provider>
  );
}

export function useSuperAdminAuth() {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) throw new Error('useSuperAdminAuth must be used within SuperAdminAuthProvider');
  return ctx;
}
