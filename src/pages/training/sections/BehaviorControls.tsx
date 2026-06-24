import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { AgentBehavior, Proactivity } from '../../../types/training';
import { Button, Card, Field } from '../../../components/ui/primitives';

const PROACTIVITY: { value: Proactivity; label: string; hint: string }[] = [
  { value: 'concise', label: 'Concise', hint: 'Answers briefly, asks little' },
  { value: 'balanced', label: 'Balanced', hint: 'Answers, follows up when useful' },
  { value: 'proactive', label: 'Proactive', hint: 'Qualifies, suggests next steps' },
];

/** How the agent acts — proactivity, what to do when unsure, escalation triggers. */
export function BehaviorControls({ onChanged }: { onChanged: () => void }) {
  const { token } = useAuth();
  const [b, setB] = useState<Partial<AgentBehavior>>({
    proactivity: 'balanced',
    collectContactInfo: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    trainingService.getBehavior(token).then((d) => {
      if (d) setB(d);
    });
  }, [token]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await trainingService.saveBehavior(
        {
          proactivity: b.proactivity,
          collectContactInfo: b.collectContactInfo,
          whenUnsure: b.whenUnsure ?? undefined,
          escalationTriggers: b.escalationTriggers ?? undefined,
        },
        token,
      );
      setSaved(true);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <h3 className="text-[15px] font-semibold text-text">How your agent behaves</h3>
      <p className="mt-0.5 text-[13px] text-text-muted">
        Shape how it talks and when it hands off to you.
      </p>

      <div className="mt-3 space-y-4">
        <Field label="How much should it gather / push?">
          <div className="flex flex-wrap gap-2">
            {PROACTIVITY.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setB({ ...b, proactivity: opt.value })}
                className={`rounded-[10px] border px-3 py-1.5 text-start transition-colors ${
                  b.proactivity === opt.value
                    ? 'border-brand bg-brand-soft'
                    : 'border-border bg-surface hover:bg-surface-muted'
                }`}
              >
                <span
                  className={`block text-[13px] font-medium ${
                    b.proactivity === opt.value ? 'text-brand' : 'text-text'
                  }`}
                >
                  {opt.label}
                </span>
                <span className="block text-[11px] text-text-subtle">{opt.hint}</span>
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            checked={b.collectContactInfo ?? true}
            onChange={(e) => setB({ ...b, collectContactInfo: e.target.checked })}
            className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
          />
          Collect the customer's name & contact when taking a request
        </label>

        <Field label="What should it do when unsure or when it depends?">
          <textarea
            rows={2}
            dir="auto"
            value={b.whenUnsure ?? ''}
            onChange={(e) => setB({ ...b, whenUnsure: e.target.value })}
            placeholder="If a request is vague, ask 1–2 questions to scope it, then offer to prepare a quote or arrange a call."
            className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
          />
        </Field>

        <Field label="Hand off to a human when… (comma-separated)">
          <input
            value={(b.escalationTriggers ?? []).join(', ')}
            onChange={(e) =>
              setB({
                ...b,
                escalationTriggers: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="refunds, complaints, custom quotes over X"
            className="h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
          />
        </Field>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          {saved && <span className="text-[13px] text-brand">Saved to draft</span>}
        </div>
      </div>
    </Card>
  );
}
