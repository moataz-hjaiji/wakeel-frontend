import { api } from '../lib/api';
import type { AdminOverview, AuthResponse, LoginPayload, SuperAdmin } from '../types/admin';

export const adminAuthService = {
  login(payload: LoginPayload) {
    return api.post<AuthResponse>('/super-admin/login', payload);
  },

  getMe(token: string) {
    return api.get<SuperAdmin>('/super-admin/me', token);
  },
};

export const adminService = {
  getOverview(token: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    const qs = params.toString();
    return api.get<AdminOverview>(`/admin/overview${qs ? `?${qs}` : ''}`, token);
  },

  updateStoreTokenLimit(token: string, storeId: string, monthlyTokenLimit: number | null) {
    return api.patch<{ id: string; monthlyTokenLimit: number | null }>(
      `/admin/stores/${storeId}/token-limit`,
      { monthlyTokenLimit },
      token,
    );
  },
};
