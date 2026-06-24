import { api, ApiError } from '../lib/api';
import type {
  Collection,
  CollectionEntry,
  CollectionField,
  CollectionPreset,
} from '../types/training';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export interface PaginatedEntries {
  items: CollectionEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

async function uploadImport(
  collectionId: string,
  token: string,
  opts: { file?: File; text?: string },
): Promise<{ imported: number }> {
  const form = new FormData();
  if (opts.file) form.append('file', opts.file);
  if (opts.text) form.append('text', opts.text);
  const res = await fetch(`${API_URL}/catalog/collections/${collectionId}/entries/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message || body.error || message;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  return res.json();
}

export const catalogService = {
  presets: (token: string) => api.get<CollectionPreset[]>('/catalog/presets', token),

  listCollections: (token: string) =>
    api.get<Collection[]>('/catalog/collections', token),

  createCollection: (
    body: { name: string; icon?: string; preset?: string },
    token: string,
  ) => api.post<Collection>('/catalog/collections', body, token),

  deleteCollection: (collectionId: string, token: string) =>
    api.delete<void>(`/catalog/collections/${collectionId}`, token),

  listFields: (collectionId: string, token: string) =>
    api.get<CollectionField[]>(`/catalog/collections/${collectionId}/fields`, token),

  createField: (collectionId: string, body: Partial<CollectionField>, token: string) =>
    api.post<CollectionField>(`/catalog/collections/${collectionId}/fields`, body, token),

  updateField: (
    collectionId: string,
    fieldId: string,
    body: Partial<CollectionField>,
    token: string,
  ) =>
    api.patch<CollectionField>(
      `/catalog/collections/${collectionId}/fields/${fieldId}`,
      body,
      token,
    ),

  deleteField: (collectionId: string, fieldId: string, token: string) =>
    api.delete<void>(`/catalog/collections/${collectionId}/fields/${fieldId}`, token),

  listEntries: (
    collectionId: string,
    token: string,
    params?: { page?: number; limit?: number; status?: 'draft' | 'published' | 'all' },
  ) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return api.get<PaginatedEntries>(
      `/catalog/collections/${collectionId}/entries${qs ? `?${qs}` : ''}`,
      token,
    );
  },

  createEntry: (collectionId: string, values: Record<string, unknown>, token: string) =>
    api.post<CollectionEntry>(`/catalog/collections/${collectionId}/entries`, { values }, token),

  updateEntry: (
    collectionId: string,
    entryId: string,
    values: Record<string, unknown>,
    token: string,
  ) =>
    api.patch<CollectionEntry>(
      `/catalog/collections/${collectionId}/entries/${entryId}`,
      { values },
      token,
    ),

  deleteEntry: (collectionId: string, entryId: string, token: string) =>
    api.delete<void>(`/catalog/collections/${collectionId}/entries/${entryId}`, token),

  bulkDelete: (collectionId: string, ids: string[], token: string) =>
    api.post<void>(`/catalog/collections/${collectionId}/entries/bulk-delete`, { ids }, token),

  importEntries: (collectionId: string, token: string, opts: { file?: File; text?: string }) =>
    uploadImport(collectionId, token, opts),
};
