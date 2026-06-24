import type { ConversationRow } from '../../types/conversations';
import { StatusChip } from './StatusChip';

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Avatar({ row }: { row: ConversationRow }) {
  const initial = (row.displayName ?? row.phone)?.[0]?.toUpperCase() ?? '?';
  if (row.avatarUrl) {
    return <img src={row.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />;
  }
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
      {initial}
    </span>
  );
}

export function ConversationList({
  rows,
  selected,
  onSelect,
  loading,
}: {
  rows: ConversationRow[];
  selected: string | null;
  onSelect: (phone: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="grid h-full place-items-center px-4 text-center">
        <div>
          <p className="text-[13px] font-medium text-text">No conversations yet</p>
          <p className="mt-1 text-[12px] text-text-subtle">
            Once your WhatsApp is connected, customer chats show up here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {rows.map((row) => {
        const isSel = row.phone === selected;
        return (
          <button
            key={row.phone}
            type="button"
            onClick={() => onSelect(row.phone)}
            className={`flex w-full items-start gap-2.5 border-b border-border px-3 py-2.5 text-start transition-colors ${
              isSel ? 'bg-brand-soft' : 'hover:bg-surface-muted'
            }`}
          >
            <Avatar row={row} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[13px] font-medium text-text">
                  {row.displayName ?? `+${row.phone}`}
                </span>
                <span className="shrink-0 text-[11px] text-text-subtle">
                  {timeAgo(row.lastActiveAt)}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-text-muted" dir="auto">
                {row.lastMessage
                  ? `${row.lastMessage.sentBy === 'customer' ? '' : '↩ '}${row.lastMessage.content}`
                  : '—'}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <StatusChip status={row.status} />
                {row.unreadCount > 0 && (
                  <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                    {row.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
