import { api, ApiError } from '../lib/api';
import type {
  AgentBehavior,
  BusinessKnowledge,
  BusinessProfile,
  Collection,
  CollectionEntry,
  CollectionField,
  CollectionPreset,
  InterviewAnswerResult,
  InterviewQuestion,
  OperatingHours,
  OverviewSection,
  Policy,
  PreviewReply,
  QnaPair,
  ServiceZone,
  TrainingDocument,
  TrainingStatusCounts,
} from '../types/training';

const API_URL = import.meta.env.VITE_API_URL || '/api';

type Reorder = Array<{ id: string; position: number }>;

/** Multipart upload that also carries optional text fields (entry import). */
async function uploadEntries(
  collectionId: string,
  token: string,
  opts: { file?: File; text?: string },
): Promise<{ imported: number }> {
  const form = new FormData();
  if (opts.file) form.append('file', opts.file);
  if (opts.text) form.append('text', opts.text);
  const res = await fetch(`${API_URL}/training/collections/${collectionId}/entries/import`, {
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

export const trainingService = {
  // Presets / publish / status
  presets: (t: string) => api.get<CollectionPreset[]>('/training/presets', t),
  publish: (t: string) => api.post<{ published: number }>('/training/publish', {}, t),
  status: (t: string) => api.get<TrainingStatusCounts>('/training/status', t),

  // Business profile
  getProfile: (t: string) => api.get<BusinessProfile | null>('/training/business-profile', t),
  saveProfile: (body: Partial<BusinessProfile>, t: string) =>
    api.put<BusinessProfile>('/training/business-profile', body, t),

  // Hours
  getHours: (t: string) => api.get<OperatingHours | null>('/training/hours', t),
  saveHours: (body: Partial<OperatingHours>, t: string) =>
    api.put<OperatingHours>('/training/hours', body, t),

  // Collections
  listCollections: (t: string) => api.get<Collection[]>('/training/collections', t),
  createCollection: (body: { name: string; icon?: string; preset?: string }, t: string) =>
    api.post<Collection>('/training/collections', body, t),
  updateCollection: (id: string, body: Partial<Collection>, t: string) =>
    api.patch<Collection>(`/training/collections/${id}`, body, t),
  deleteCollection: (id: string, t: string) =>
    api.delete<void>(`/training/collections/${id}`, t),
  reorderCollections: (order: Reorder, t: string) =>
    api.patch<void>('/training/collections/reorder', { order }, t),

  // Fields
  listFields: (cid: string, t: string) =>
    api.get<CollectionField[]>(`/training/collections/${cid}/fields`, t),
  createField: (cid: string, body: Partial<CollectionField>, t: string) =>
    api.post<CollectionField>(`/training/collections/${cid}/fields`, body, t),
  updateField: (cid: string, id: string, body: Partial<CollectionField>, t: string) =>
    api.patch<CollectionField>(`/training/collections/${cid}/fields/${id}`, body, t),
  deleteField: (cid: string, id: string, t: string) =>
    api.delete<void>(`/training/collections/${cid}/fields/${id}`, t),
  reorderFields: (cid: string, order: Reorder, t: string) =>
    api.patch<void>(`/training/collections/${cid}/fields/reorder`, { order }, t),

  // Entries
  listEntries: (cid: string, t: string) =>
    api.get<CollectionEntry[]>(`/training/collections/${cid}/entries`, t),
  createEntry: (cid: string, values: Record<string, unknown>, t: string) =>
    api.post<CollectionEntry>(`/training/collections/${cid}/entries`, { values }, t),
  updateEntry: (cid: string, id: string, values: Record<string, unknown>, t: string) =>
    api.patch<CollectionEntry>(`/training/collections/${cid}/entries/${id}`, { values }, t),
  deleteEntry: (cid: string, id: string, t: string) =>
    api.delete<void>(`/training/collections/${cid}/entries/${id}`, t),
  reorderEntries: (cid: string, order: Reorder, t: string) =>
    api.patch<void>(`/training/collections/${cid}/entries/reorder`, { order }, t),
  importEntries: (cid: string, t: string, opts: { file?: File; text?: string }) =>
    uploadEntries(cid, t, opts),

  // Zones
  listZones: (t: string) => api.get<ServiceZone[]>('/training/zones', t),
  createZone: (body: Partial<ServiceZone>, t: string) =>
    api.post<ServiceZone>('/training/zones', body, t),
  updateZone: (id: string, body: Partial<ServiceZone>, t: string) =>
    api.patch<ServiceZone>(`/training/zones/${id}`, body, t),
  deleteZone: (id: string, t: string) => api.delete<void>(`/training/zones/${id}`, t),

  // Policies
  listPolicies: (t: string) => api.get<Policy[]>('/training/policies', t),
  createPolicy: (body: Partial<Policy>, t: string) =>
    api.post<Policy>('/training/policies', body, t),
  updatePolicy: (id: string, body: Partial<Policy>, t: string) =>
    api.patch<Policy>(`/training/policies/${id}`, body, t),
  deletePolicy: (id: string, t: string) => api.delete<void>(`/training/policies/${id}`, t),

  // Q&A
  listQna: (t: string) => api.get<QnaPair[]>('/training/qna', t),
  createQna: (body: Partial<QnaPair>, t: string) => api.post<QnaPair>('/training/qna', body, t),
  updateQna: (id: string, body: Partial<QnaPair>, t: string) =>
    api.patch<QnaPair>(`/training/qna/${id}`, body, t),
  deleteQna: (id: string, t: string) => api.delete<void>(`/training/qna/${id}`, t),

  // Unified overview — exactly what the agent knows
  overview: (t: string) => api.get<OverviewSection[]>('/training/overview', t),

  // Business knowledge (flexible store)
  listKnowledge: (t: string) => api.get<BusinessKnowledge[]>('/training/knowledge', t),
  createKnowledge: (body: { topic: string; content: string }, t: string) =>
    api.post<BusinessKnowledge>('/training/knowledge', body, t),
  updateKnowledge: (id: string, body: Partial<BusinessKnowledge>, t: string) =>
    api.patch<BusinessKnowledge>(`/training/knowledge/${id}`, body, t),
  deleteKnowledge: (id: string, t: string) =>
    api.delete<void>(`/training/knowledge/${id}`, t),
  documentKnowledge: (docId: string, t: string) =>
    api.get<BusinessKnowledge[]>(`/training/documents/${docId}/knowledge`, t),

  // Agent behavior
  getBehavior: (t: string) => api.get<AgentBehavior | null>('/training/behavior', t),
  saveBehavior: (body: Partial<AgentBehavior>, t: string) =>
    api.put<AgentBehavior>('/training/behavior', body, t),

  // AI interviewer
  interviewNext: (history: { role: 'assistant' | 'user'; content: string }[], t: string) =>
    api.post<InterviewQuestion>('/training/interview/next', { history }, t),
  interviewAnswer: (
    body: {
      question: string;
      answer: string;
      history: { role: 'assistant' | 'user'; content: string }[];
    },
    t: string,
  ) => api.post<InterviewAnswerResult>('/training/interview/answer', body, t),

  // Documents
  listDocuments: (t: string) => api.get<TrainingDocument[]>('/training/documents', t),
  uploadDocument: (file: File, t: string) =>
    api.upload<TrainingDocument>('/training/documents/upload', file, t),
  deleteDocument: (id: string, t: string) => api.delete<void>(`/training/documents/${id}`, t),

  // Preview chat (reads DRAFT data)
  preview: (body: { message: string; sessionId?: string }, t: string) =>
    api.post<PreviewReply>('/training/preview-chat', body, t),
};
