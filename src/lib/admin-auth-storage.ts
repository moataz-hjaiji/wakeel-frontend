import type { SuperAdmin } from '../types/admin';

const TOKEN_KEY = 'chatbot_super_admin_token';
const ADMIN_KEY = 'chatbot_super_admin';

export const adminAuthStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getAdmin(): SuperAdmin | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SuperAdmin;
    } catch {
      return null;
    }
  },

  setAdmin(admin: SuperAdmin) {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
  },
};
