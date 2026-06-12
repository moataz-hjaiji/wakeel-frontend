export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface SendChatPayload {
  storeId: string;
  sessionId?: string;
  message: string;
}

export interface ChatReply {
  sessionId: string;
  reply: string;
}
