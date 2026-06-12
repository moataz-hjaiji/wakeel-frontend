import { api } from '../lib/api';
import type { BulkImportFaqResult, CreateFaqPayload, Faq } from '../types/faq';

export const faqService = {
  list(token: string) {
    return api.get<Faq[]>('/faqs', token);
  },

  create(payload: CreateFaqPayload, token: string) {
    return api.post<Faq>('/faqs', payload, token);
  },

  importFile(file: File, token: string) {
    return api.upload<BulkImportFaqResult>('/faqs/import', file, token);
  },

  update(id: string, payload: Partial<CreateFaqPayload>, token: string) {
    return api.patch<Faq>(`/faqs/${id}`, payload, token);
  },

  remove(id: string, token: string) {
    return api.delete<void>(`/faqs/${id}`, token);
  },
};
