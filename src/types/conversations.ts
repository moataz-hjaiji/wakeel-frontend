export type ConversationStatus =
  | 'agent_handling'
  | 'needs_human'
  | 'human_took_over'
  | 'blocked'
  | 'resolved'
  | 'agent_off';

export type AgentOperatingMode = 'open' | 'whitelist_only' | 'paused';
export type ListType = 'whitelist' | 'blacklist' | 'escalation';
export type SentBy = 'customer' | 'agent' | 'human';

export interface ConversationRow {
  phone: string;
  displayName: string | null;
  avatarUrl: string | null;
  lastMessage: { content: string; sentBy: SentBy; createdAt: string } | null;
  lastActiveAt: string | null;
  unreadCount: number;
  tags: string[];
  escalationReason: string | null;
  status: ConversationStatus;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  sentBy: SentBy;
  content: string;
  createdAt: string;
  intent?: string | null;
}

export interface ContactActivity {
  id: string;
  type: string;
  actor: 'system' | 'owner';
  reason: string | null;
  createdAt: string;
}

export interface ContactPanel {
  phone: string;
  displayName: string | null;
  notes: string | null;
  tags: string[];
  agentMode: 'auto' | 'human';
  resolved: boolean;
  escalationReason: string | null;
  unreadCount: number;
  blockReason: string | null;
  blockedAt: string | null;
  blockedBy: 'system' | 'owner' | null;
  firstSeenAt: string | null;
  lastActiveAt: string | null;
  totalMessages: number;
  waName: string | null;
  waPushName: string | null;
  waAvatarUrl: string | null;
  waAbout: string | null;
  waIsBusiness: boolean | null;
  waLabels: string[] | null;
  waIsSavedContact: boolean | null;
  status: ConversationStatus;
  lists: ListType[];
  activity: ContactActivity[];
}

export interface ListMember {
  id: string;
  phone: string;
  listType: ListType;
  reason: string | null;
  addedBy: 'system' | 'owner';
  createdAt: string;
}

export interface ConversationStats {
  agent_handling: number;
  needs_human: number;
  human_took_over: number;
  blocked: number;
  resolved: number;
  agent_off: number;
  needsAttention: number;
  all: number;
}

/** Realtime event payloads (room store:<id>). */
export interface RtMessageCreated {
  phone: string;
  message: ConversationMessage;
}
export interface RtConversationUpdated {
  phone: string;
  patch: Partial<ConversationRow> & { status?: ConversationStatus };
}
export interface RtConversationEscalated {
  phone: string;
  reason: string | null;
  status: ConversationStatus;
}
