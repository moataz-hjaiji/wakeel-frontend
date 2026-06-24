import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conversationsService } from '../../services/conversations.service';
import type {
  AgentOperatingMode,
  ConversationMessage,
  ConversationRow,
  ConversationStats,
  ConversationStatus,
} from '../../types/conversations';
import { Button } from '../../components/ui/primitives';
import { ConversationList } from './ConversationList';
import { MessageThread } from './MessageThread';
import { ContactPanel } from './ContactPanel';
import { ListManager } from './ListManager';
import { useConversationsSocket } from './useConversationsSocket';

const MODES: { value: AgentOperatingMode; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'whitelist_only', label: 'Whitelist only' },
  { value: 'paused', label: 'Paused (all off)' },
];

const STATUS_FILTERS: { value: ConversationStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'needs_human', label: 'Needs you' },
  { value: 'agent_handling', label: 'Agent' },
  { value: 'human_took_over', label: 'You' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'resolved', label: 'Resolved' },
];

export function ConversationsPage() {
  const { token } = useAuth();
  const [rows, setRows] = useState<ConversationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [stats, setStats] = useState<ConversationStats | null>(null);
  const [mode, setMode] = useState<AgentOperatingMode>('open');
  const [filter, setFilter] = useState<ConversationStatus | 'all'>('all');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [listOpen, setListOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const loadRows = useCallback(() => {
    if (!token) return;
    conversationsService.list(token, { q: search || undefined }).then((data) => {
      setRows(data);
      setLoading(false);
    });
    conversationsService.stats(token).then((s) => {
      setStats(s);
      if (s.mode) setMode(s.mode);
    });
  }, [token, search]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const loadThread = useCallback(
    (phone: string) => {
      if (!token) return;
      conversationsService.messages(phone, token).then(setMessages);
    },
    [token],
  );

  function selectPhone(phone: string) {
    setSelected(phone);
    loadThread(phone);
    // optimistic unread clear
    setRows((rs) => rs.map((r) => (r.phone === phone ? { ...r, unreadCount: 0 } : r)));
  }

  // ── realtime ──
  useConversationsSocket(token, {
    onMessage: ({ phone, message }) => {
      if (phone === selected) setMessages((m) => [...m, message]);
      setRows((rs) => {
        const idx = rs.findIndex((r) => r.phone === phone);
        if (idx === -1) {
          loadRows();
          return rs;
        }
        const updated = {
          ...rs[idx],
          lastMessage: { content: message.content, sentBy: message.sentBy, createdAt: message.createdAt },
          lastActiveAt: message.createdAt,
          unreadCount: phone === selected ? 0 : rs[idx].unreadCount + (message.sentBy === 'customer' ? 1 : 0),
        };
        return [updated, ...rs.filter((_, i) => i !== idx)];
      });
    },
    onUpdated: ({ phone, patch }) => {
      setRows((rs) => rs.map((r) => (r.phone === phone ? { ...r, ...patch } : r)));
    },
    onEscalated: () => loadRows(),
    onModeChanged: ({ mode: m }) => setMode(m as AgentOperatingMode),
  });

  async function changeMode(next: AgentOperatingMode) {
    if (!token) return;
    setMode(next);
    await conversationsService.setMode(next, token);
    loadRows();
  }

  const visibleRows = useMemo(() => {
    let r = rows;
    if (needsOnly) r = r.filter((x) => x.status === 'needs_human' || x.status === 'blocked');
    else if (filter !== 'all') r = r.filter((x) => x.status === filter);
    return r;
  }, [rows, filter, needsOnly]);

  const selectedRow = rows.find((r) => r.phone === selected) ?? null;

  return (
    <div className="space-y-3">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-border bg-surface px-4 py-2.5 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-text-muted">Agent:</span>
          <div className="flex rounded-[10px] bg-surface-muted p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => changeMode(m.value)}
                className={`rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  mode === m.value
                    ? m.value === 'paused'
                      ? 'bg-warning text-white'
                      : 'bg-surface text-text shadow-[var(--shadow-sm)]'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNeedsOnly((v) => !v)}
            className={`rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
              needsOnly ? 'bg-warning-soft text-warning' : 'border border-border text-text-muted hover:bg-surface-muted'
            }`}
          >
            🙋 Needs my attention{stats ? ` (${stats.needsAttention})` : ''}
          </button>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="h-8 w-40 rounded-[10px] border border-border bg-surface px-3 text-[12px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
          />
          <Button variant="secondary" size="sm" onClick={() => setListOpen(true)}>
            Lists
          </Button>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => {
              setFilter(f.value);
              setNeedsOnly(false);
            }}
            className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors ${
              filter === f.value && !needsOnly
                ? 'bg-brand text-white'
                : 'border border-border text-text-muted hover:bg-surface-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 3-pane */}
      <div
        className={`grid h-[calc(100vh-12rem)] gap-3 ${
          panelOpen ? 'grid-cols-[300px_1fr_320px]' : 'grid-cols-[300px_1fr]'
        } max-[1100px]:grid-cols-[260px_1fr]`}
      >
        <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-sm)]">
          <ConversationList rows={visibleRows} selected={selected} onSelect={selectPhone} loading={loading} />
        </div>

        <div className="min-w-0">
          {selectedRow ? (
            <MessageThread
              row={selectedRow}
              messages={messages}
              onLocalMessage={(m) => setMessages((ms) => [...ms, m])}
              onChanged={() => {
                loadRows();
                if (selected) loadThread(selected);
              }}
            />
          ) : (
            <div className="grid h-full place-items-center rounded-[14px] border border-border bg-surface text-center">
              <div>
                <p className="text-[14px] font-medium text-text">Select a conversation</p>
                <p className="mt-1 text-[12px] text-text-subtle">Pick a chat on the left to view it.</p>
              </div>
            </div>
          )}
        </div>

        {panelOpen && selectedRow && (
          <div className="relative min-w-0 max-[1100px]:hidden">
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              className="absolute end-2 top-2 z-10 text-[12px] text-text-subtle hover:text-text"
            >
              ✕
            </button>
            <ContactPanel
              key={selectedRow.phone}
              phone={selectedRow.phone}
              onChanged={() => {
                loadRows();
              }}
            />
          </div>
        )}
      </div>

      <ListManager open={listOpen} onClose={() => setListOpen(false)} />
    </div>
  );
}
