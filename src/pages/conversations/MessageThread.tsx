import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conversationsService } from '../../services/conversations.service';
import { ApiError } from '../../lib/api';
import { Button } from '../../components/ui/primitives';
import type {
  ConversationMessage,
  ConversationRow,
} from '../../types/conversations';

/** Plain-language banner driven by the conversation status. */
function modeBanner(status: ConversationRow['status']): {
  text: string;
  tone: string;
  canSend: boolean;
} {
  switch (status) {
    case 'agent_handling':
      return { text: 'Your agent is handling this chat.', tone: 'bg-brand-soft text-brand', canSend: false };
    case 'needs_human':
      return { text: 'Your agent asked for help — you can reply.', tone: 'bg-warning-soft text-warning', canSend: true };
    case 'human_took_over':
      return { text: "You're replying to this person. Hand back when done.", tone: 'bg-info-soft text-info', canSend: true };
    case 'blocked':
      return { text: 'Agent is blocked for this contact. Only you can reply.', tone: 'bg-danger-soft text-danger', canSend: true };
    case 'agent_off':
      return { text: 'Agent is off for this contact. You can reply.', tone: 'bg-surface-muted text-text-muted', canSend: true };
    case 'resolved':
      return { text: 'This conversation is resolved.', tone: 'bg-surface-muted text-text-muted', canSend: true };
  }
}

function Bubble({ m }: { m: ConversationMessage }) {
  const isCustomer = m.sentBy === 'customer';
  const isHuman = m.sentBy === 'human';
  return (
    <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
      <div
        dir="auto"
        className={`max-w-[78%] rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
          isCustomer
            ? 'rounded-bl-md border border-border bg-surface text-text'
            : isHuman
              ? 'rounded-br-md bg-info text-white'
              : 'rounded-br-md bg-brand text-white'
        }`}
      >
        {!isCustomer && (
          <p className="mb-0.5 text-[10px] font-medium opacity-80">
            {isHuman ? 'You' : '🤖 AI'}
          </p>
        )}
        <p className="whitespace-pre-wrap">{m.content}</p>
      </div>
    </div>
  );
}

export function MessageThread({
  row,
  messages,
  onLocalMessage,
  onChanged,
}: {
  row: ConversationRow;
  messages: ConversationMessage[];
  onLocalMessage: (m: ConversationMessage) => void;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const banner = modeBanner(row.status);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !token || sending) return;
    setError('');
    setSending(true);
    try {
      await conversationsService.send(row.phone, text, token);
      setInput('');
      onLocalMessage({
        id: crypto.randomUUID(),
        role: 'assistant',
        sentBy: 'human',
        content: text,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send');
    } finally {
      setSending(false);
    }
  }

  async function act(fn: () => Promise<unknown>) {
    if (!token) return;
    await fn();
    onChanged();
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-sm)]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-text">
            {row.displayName ?? `+${row.phone}`}
          </p>
          <p className="text-[11px] text-text-subtle">+{row.phone}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {row.status === 'human_took_over' ? (
            <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.handback(row.phone, token!))}>
              Hand back to agent
            </Button>
          ) : row.status === 'agent_handling' ? (
            <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.takeover(row.phone, token!))}>
              Take over
            </Button>
          ) : null}
          {row.status === 'resolved' ? (
            <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.reopen(row.phone, token!))}>
              Reopen
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.resolve(row.phone, token!))}>
              Resolve
            </Button>
          )}
        </div>
      </div>

      {/* Mode banner */}
      <div className={`shrink-0 px-4 py-1.5 text-[12px] font-medium ${banner.tone}`}>
        {banner.text}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto bg-bg px-4 py-3">
        {messages.map((m) => (
          <Bubble key={m.id} m={m} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={send} className="shrink-0 border-t border-border p-2.5">
        {error && <p className="mb-1.5 text-[12px] text-danger">{error}</p>}
        {banner.canSend ? (
          <div className="flex gap-2">
            <input
              dir="auto"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a reply…"
              disabled={sending}
              className="h-9 flex-1 rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
            />
            <Button type="submit" disabled={!input.trim() || sending}>
              Send
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-[10px] bg-surface-muted px-3 py-2">
            <span className="text-[12px] text-text-subtle">
              The agent is handling this. Take over to reply yourself.
            </span>
            <Button
              size="sm"
              onClick={() => act(() => conversationsService.takeover(row.phone, token!))}
            >
              Take over
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
