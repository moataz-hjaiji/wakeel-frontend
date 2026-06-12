import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authStorage } from '../lib/auth-storage';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload, Store } from '../types/auth';

interface AuthContextValue {
  store: Store | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function persistSession(token: string, store: Store) {
  authStorage.setToken(token);
  authStorage.setStore(store);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store | null>(() => authStorage.getStore());
  const [token, setToken] = useState<string | null>(() => authStorage.getToken());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const savedToken = authStorage.getToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await authService.getMe(savedToken);
        setToken(savedToken);
        setStore(me);
        authStorage.setStore(me);
      } catch {
        authStorage.clear();
        setToken(null);
        setStore(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    persistSession(res.access_token, res.store);
    setToken(res.access_token);
    setStore(res.store);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authService.register(payload);
    persistSession(res.access_token, res.store);
    setToken(res.access_token);
    setStore(res.store);
  }, []);

  const logout = useCallback(() => {
    authStorage.clear();
    setToken(null);
    setStore(null);
  }, []);

  const value = useMemo(
    () => ({
      store,
      token,
      isLoading,
      isAuthenticated: !!token && !!store,
      login,
      register,
      logout,
    }),
    [store, token, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
