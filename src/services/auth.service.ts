import { api } from '../lib/api';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  Store,
} from '../types/auth';

export const authService = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>('/stores/login', payload);
  },

  register(payload: RegisterPayload) {
    return api.post<AuthResponse>('/stores/register', payload);
  },

  getMe(token: string) {
    return api.get<Store>('/stores/me', token);
  },
};
