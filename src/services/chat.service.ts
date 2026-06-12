import { api } from '../lib/api';
import type { ChatMessage, ChatReply, SendChatPayload } from '../types/chat';

export const chatService = {
  send(payload: SendChatPayload) {
    return api.post<ChatReply>('/chat', payload);
  },

  getHistory(sessionId: string, storeId: string) {
    return api.get<ChatMessage[]>(`/chat/${sessionId}/history?storeId=${storeId}`);
  },
};
