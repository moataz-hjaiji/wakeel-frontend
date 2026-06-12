import { api } from '../lib/api';
import type {
  BulkImportElementResult,
  CatalogElement,
  CreateElementPayload,
  ElementType,
} from '../types/element';

export const elementService = {
  list(token: string, type?: ElementType) {
    const qs = type ? `?type=${type}` : '';
    return api.get<CatalogElement[]>(`/elements${qs}`, token);
  },

  create(payload: CreateElementPayload, token: string) {
    return api.post<CatalogElement>('/elements', payload, token);
  },

  importFile(file: File, token: string) {
    return api.upload<BulkImportElementResult>('/elements/import', file, token);
  },

  update(id: string, payload: Partial<CreateElementPayload>, token: string) {
    return api.patch<CatalogElement>(`/elements/${id}`, payload, token);
  },

  remove(id: string, token: string) {
    return api.delete<void>(`/elements/${id}`, token);
  },
};
