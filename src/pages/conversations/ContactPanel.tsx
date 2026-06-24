import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conversationsService } from '../../services/conversations.service';
import { Badge, Button, Field, Input } from '../../components/ui/primitives';
import type { ContactPanel as ContactPanelData } from '../../types/conversations';

export function ContactPanel({
  phone,
  onChanged,
}: {
  phone: string;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [data, setData] = useState<ContactPanelData | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');

  const load = () => {
    if (!token) return;
    conversationsService.contact(phone, token).then((d) => {
      setData(d);
      setDisplayName(d.displayName ?? '');
      setNotes(d.notes ?? '');
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, token]);

  if (!data) {
    return <div className="h-24 animate-pulse rounded-[14px] bg-surface-muted" />;
  }

  async function saveDetails() {
    if (!token) return;
    await conversationsService.patch(phone, { displayName, notes }, token);
    onChanged();
  }

  async function addTag() {
    const t = tagInput.trim();
    if (!t || !token || !data) return;
    const tags = [...new Set([...data.tags, t])];
    await conversationsService.patch(phone, { tags }, token);
    setTagInput('');
    load();
    onChanged();
  }

  async function removeTag(tag: string) {
    if (!token || !data) return;
    await conversationsService.patch(phone, { tags: data.tags.filter((x) => x !== tag) }, token);
    load();
    onChanged();
  }

  async function act(fn: () => Promise<unknown>) {
    await fn();
    load();
    onChanged();
  }

  const blocked = data.lists.includes('blacklist') || data.lists.includes('escalation');

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-[14px] border border-border bg-surface p-4 shadow-[var(--shadow-sm)]">
      {/* Identity */}
      <div className="flex flex-col items-center text-center">
        {data.waAvatarUrl ? (
          <img src={data.waAvatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-soft text-xl font-semibold text-brand">
            {(displayName || data.waPushName || phone)[0]?.toUpperCase()}
          </span>
        )}
        <p className="mt-2 text-[14px] font-semibold text-text">
          {displayName || data.waName || data.waPushName || `+${phone}`}
        </p>
        <p className="text-[12px] text-text-subtle">+{phone}</p>
        {data.waIsBusiness && <Badge tone="info">Business account</Badge>}
        {data.waAbout && (
          <p className="mt-1 text-[12px] italic text-text-muted" dir="auto">
            “{data.waAbout}”
          </p>
        )}
      </div>

      {/* Escalation reason */}
      {data.escalationReason && (
        <div className="rounded-[10px] bg-warning-soft px-3 py-2 text-[12px] text-warning">
          Needs you — {data.escalationReason}
        </div>
      )}

      {/* Block reason */}
      {data.blockReason && (
        <div className="rounded-[10px] bg-danger-soft px-3 py-2 text-[12px] text-danger">
          Agent blocked — {data.blockedBy === 'system' ? 'escalated' : 'by you'}
          {data.blockedAt ? `, ${new Date(data.blockedAt).toLocaleDateString()}` : ''}: {data.blockReason}
        </div>
      )}

      {/* Quick controls */}
      <div className="flex flex-wrap gap-2">
        {data.agentMode === 'human' ? (
          <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.handback(phone, token!))}>
            Hand back to agent
          </Button>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => act(() => conversationsService.takeover(phone, token!))}>
            Take over
          </Button>
        )}
        {blocked ? (
          <Button variant="secondary" size="sm" className="border-brand/30 text-brand" onClick={() => act(() => conversationsService.unblock(phone, token!))}>
            Unblock agent
          </Button>
        ) : (
          <Button variant="secondary" size="sm" className="border-danger/30 text-danger hover:bg-danger-soft" onClick={() => act(() => conversationsService.block(phone, 'Manually blocked', token!))}>
            Block agent
          </Button>
        )}
      </div>

      {/* Tenant-editable */}
      <Field label="Display name">
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} onBlur={saveDetails} />
      </Field>
      <Field label="Notes (team-only)">
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveDetails}
          className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-text focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
        />
      </Field>
      <Field label="Tags">
        <div className="flex flex-wrap gap-1.5">
          {data.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2 py-0.5 text-[12px] text-text-muted">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-text-subtle hover:text-danger">
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag"
          />
        </div>
      </Field>

      {/* Facts */}
      <div className="space-y-1 border-t border-border pt-3 text-[12px] text-text-muted">
        <Row label="First seen" value={data.firstSeenAt ? new Date(data.firstSeenAt).toLocaleDateString() : '—'} />
        <Row label="Last active" value={data.lastActiveAt ? new Date(data.lastActiveAt).toLocaleString() : '—'} />
        <Row label="Total messages" value={String(data.totalMessages)} />
        <Row label="Saved contact" value={data.waIsSavedContact == null ? '—' : data.waIsSavedContact ? 'Yes' : 'No'} />
        {data.lists.length > 0 && <Row label="Lists" value={data.lists.join(', ')} />}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-text-subtle">{label}</span>
      <span className="text-text">{value}</span>
    </div>
  );
}
