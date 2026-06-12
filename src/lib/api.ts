const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      // ignore parse errors
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  if (!text) return undefined as T;

  return JSON.parse(text) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'GET' }, token),

  post: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, token),

  patch: <T>(path: string, body: unknown, token?: string | null) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }, token),

  delete: <T>(path: string, token?: string | null) =>
    request<T>(path, { method: 'DELETE' }, token),

  upload: async <T>(path: string, file: File, token: string): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = await res.json();
        message = body.message || body.error || message;
        if (Array.isArray(message)) message = message.join(', ');
      } catch {
        // ignore
      }
      throw new ApiError(message, res.status);
    }

    return res.json();
  },
};
