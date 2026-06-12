import type { Store } from '../types/auth';

const TOKEN_KEY = 'chatbot_access_token';
const STORE_KEY = 'chatbot_store';

export const authStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  getStore(): Store | null {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Store;
    } catch {
      return null;
    }
  },

  setStore(store: Store) {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  },

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORE_KEY);
  },
};
