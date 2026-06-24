import { api } from '../lib/api';
import type {
  AgentOperatingMode,
  ContactPanel,
  ConversationMessage,
  ConversationRow,
  ConversationStats,
  ListMember,
  ListType,
} from '../types/conversations';

export const conversationsService = {
  list: (
    token: string,
    filters: { status?: string; tag?: string; q?: string } = {},
  ) => {
    const qs = new URLSearchParams(
      Object.entries(filters).filter(([, v]) => v) as [string, string][],
    ).toString();
    return api.get<ConversationRow[]>(`/conversations${qs ? `?${qs}` : ''}`, token);
  },
  stats: (token: string) => api.get<ConversationStats>('/conversations/stats', token),
  setMode: (mode: AgentOperatingMode, token: string) =>
    api.put<{ mode: AgentOperatingMode }>('/conversations/mode', { mode }, token),

  messages: (phone: string, token: string) =>
    api.get<ConversationMessage[]>(`/conversations/${phone}/messages`, token),
  contact: (phone: string, token: string) =>
    api.get<ContactPanel>(`/conversations/${phone}/contact`, token),
  patch: (
    phone: string,
    body: { displayName?: string; notes?: string; tags?: string[] },
    token: string,
  ) => api.patch<ContactPanel>(`/conversations/${phone}`, body, token),

  send: (phone: string, message: string, token: string) =>
    api.post<{ ok: boolean }>(`/conversations/${phone}/send`, { message }, token),

  takeover: (phone: string, token: string) =>
    api.post<void>(`/conversations/${phone}/takeover`, {}, token),
  handback: (phone: string, token: string) =>
    api.post<void>(`/conversations/${phone}/handback`, {}, token),
  block: (phone: string, reason: string | undefined, token: string) =>
    api.post<void>(`/conversations/${phone}/block`, { reason }, token),
  unblock: (phone: string, token: string) =>
    api.post<void>(`/conversations/${phone}/unblock`, {}, token),
  resolve: (phone: string, token: string) =>
    api.post<void>(`/conversations/${phone}/resolve`, {}, token),
  reopen: (phone: string, token: string) =>
    api.post<void>(`/conversations/${phone}/reopen`, {}, token),

  listMembers: (type: ListType, token: string) =>
    api.get<ListMember[]>(`/conversations/lists/${type}`, token),
  addListMember: (type: ListType, phone: string, reason: string | undefined, token: string) =>
    api.post<ListMember>(`/conversations/lists/${type}`, { phone, reason }, token),
  removeListMember: (type: ListType, phone: string, token: string) =>
    api.delete<void>(`/conversations/lists/${type}/${phone}`, token),
  bulkAddList: (type: ListType, text: string, token: string) =>
    api.post<{ imported: number }>(`/conversations/lists/${type}/bulk`, { text }, token),
};
