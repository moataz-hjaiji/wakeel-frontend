import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { conversationsService } from '../../services/conversations.service';
import { Modal } from '../../components/ui/Modal';
import { Button, Input } from '../../components/ui/primitives';
import type { ListMember, ListType } from '../../types/conversations';

const TABS: { type: ListType; label: string; hint: string }[] = [
  { type: 'whitelist', label: 'Whitelist', hint: 'Agent always answers these numbers.' },
  { type: 'blacklist', label: 'Blacklist', hint: 'Agent never answers these — only you can.' },
  { type: 'escalation', label: 'Escalation-blocked', hint: 'Auto-blocked after asking for a human.' },
];

export function ListManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { token } = useAuth();
  const [tab, setTab] = useState<ListType>('whitelist');
  const [members, setMembers] = useState<ListMember[]>([]);
  const [phone, setPhone] = useState('');
  const [bulk, setBulk] = useState('');

  const load = () => token && conversationsService.listMembers(tab, token).then(setMembers);
  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab, token]);

  async function add() {
    if (!token || !phone.trim()) return;
    await conversationsService.addListMember(tab, phone.replace(/[^\d]/g, ''), undefined, token);
    setPhone('');
    load();
  }
  async function bulkAdd() {
    if (!token || !bulk.trim()) return;
    await conversationsService.bulkAddList(tab, bulk, token);
    setBulk('');
    load();
  }
  async function remove(p: string) {
    if (!token) return;
    await conversationsService.removeListMember(tab, p, token);
    load();
  }

  const current = TABS.find((t) => t.type === tab)!;

  return (
    <Modal open={open} title="Manage lists" onClose={onClose}>
      <div className="flex gap-1 rounded-[10px] bg-surface-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => setTab(t.type)}
            className={`flex-1 rounded-md py-1.5 text-[12px] font-medium transition-colors ${
              tab === t.type ? 'bg-surface text-text shadow-[var(--shadow-sm)]' : 'text-text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[12px] text-text-subtle">{current.hint}</p>

      <div className="mt-3 flex gap-2">
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
        <Button onClick={add} disabled={!phone.trim()}>
          Add
        </Button>
      </div>

      <details className="mt-2">
        <summary className="cursor-pointer text-[12px] font-medium text-brand">Bulk add (paste/CSV)</summary>
        <textarea
          rows={3}
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
          placeholder={'216200000001\n216200000002\n…  (or a CSV with a phone column)'}
          className="mt-2 w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[12px] text-text focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
        />
        <Button variant="secondary" size="sm" className="mt-1.5" onClick={bulkAdd} disabled={!bulk.trim()}>
          Import
        </Button>
      </details>

      <div className="mt-3 max-h-52 space-y-1 overflow-y-auto">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-1.5 text-[12px]">
            <span className="text-text">
              +{m.phone}
              {m.reason && <span className="text-text-subtle"> · {m.reason}</span>}
              <span className="text-text-subtle"> · {m.addedBy}</span>
            </span>
            <button type="button" onClick={() => remove(m.phone)} className="font-medium text-danger hover:underline">
              Remove
            </button>
          </div>
        ))}
        {members.length === 0 && <p className="px-1 text-[12px] text-text-subtle">Empty.</p>}
      </div>
    </Modal>
  );
}
