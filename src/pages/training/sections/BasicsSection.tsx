import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { BusinessProfile, ToneOfVoice } from '../../../types/training';
import { Button, Card, Field, Input } from '../../../components/ui/primitives';
import type { SectionProps } from '../TrainingPage';
import { BehaviorControls } from './BehaviorControls';

const TONES: { value: ToneOfVoice; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'formal', label: 'Formal' },
  { value: 'playful', label: 'Playful' },
];

export function BasicsSection({ onChanged }: SectionProps) {
  const { token } = useAuth();
  const [p, setP] = useState<Partial<BusinessProfile>>({ toneOfVoice: 'friendly' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    trainingService.getProfile(token).then((data) => {
      if (data) setP(data);
    });
  }, [token]);

  async function save() {
    if (!token) return;
    setSaving(true);
    setSaved(false);
    try {
      await trainingService.saveProfile(
        {
          businessName: p.businessName ?? undefined,
          oneLiner: p.oneLiner ?? undefined,
          location: p.location ?? undefined,
          contact: p.contact ?? undefined,
          toneOfVoice: p.toneOfVoice,
          toneDescription: p.toneDescription ?? undefined,
          pricingLogic: p.pricingLogic ?? undefined,
          quoteByRequest: p.quoteByRequest ?? undefined,
          needsInfoToQuote: p.needsInfoToQuote ?? undefined,
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
    <div className="space-y-4">
    <Card>
      <h3 className="text-[15px] font-semibold text-text">About your business</h3>
      <p className="mt-0.5 text-[13px] text-text-muted">
        The basics your agent uses to introduce itself and answer simple questions.
      </p>

      <div className="mt-4 space-y-4">
        <Field label="Business name">
          <Input
            value={p.businessName ?? ''}
            onChange={(e) => setP({ ...p, businessName: e.target.value })}
            placeholder="e.g. Bella Pizza"
          />
        </Field>

        <Field label="What you do (one line)">
          <Input
            value={p.oneLiner ?? ''}
            onChange={(e) => setP({ ...p, oneLiner: e.target.value })}
            placeholder="Wood-fired pizza in downtown Tunis."
          />
        </Field>

        <Field label="Location">
          <Input
            value={p.location ?? ''}
            onChange={(e) => setP({ ...p, location: e.target.value })}
            placeholder="12 Avenue Habib Bourguiba, Tunis"
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Phone / WhatsApp">
            <Input
              value={p.contact?.whatsapp ?? ''}
              onChange={(e) =>
                setP({ ...p, contact: { ...p.contact, whatsapp: e.target.value } })
              }
              placeholder="+216 ..."
            />
          </Field>
          <Field label="Email">
            <Input
              value={p.contact?.email ?? ''}
              onChange={(e) => setP({ ...p, contact: { ...p.contact, email: e.target.value } })}
              placeholder="hello@store.com"
            />
          </Field>
        </div>

        <Field label="Tone of voice">
          <div className="flex flex-wrap gap-2">
            {TONES.map((tone) => (
              <button
                key={tone.value}
                type="button"
                onClick={() => setP({ ...p, toneOfVoice: tone.value })}
                className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                  p.toneOfVoice === tone.value
                    ? 'bg-brand text-white'
                    : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'
                }`}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Anything about how you speak to customers? (optional)">
          <Input
            value={p.toneDescription ?? ''}
            onChange={(e) => setP({ ...p, toneDescription: e.target.value })}
            placeholder="Warm, use light emojis, call customers by name."
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        {saved && <span className="text-[13px] text-brand">Saved to draft</span>}
      </div>
    </Card>

      {/* How we price — for businesses where price depends on the request */}
      <Card>
        <h3 className="text-[15px] font-semibold text-text">How you price</h3>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Fixed prices go in the Catalog. Use this when pricing <strong>depends on the request</strong>{' '}
          (agencies, SaaS, custom work) — the agent will ask for details and prepare a quote instead
          of guessing a number.
        </p>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2 text-[13px] text-text">
            <input
              type="checkbox"
              checked={p.quoteByRequest ?? false}
              onChange={(e) => setP({ ...p, quoteByRequest: e.target.checked })}
              className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
            />
            Pricing depends on the request (no fixed price)
          </label>
          <Field label="How you price / how you work (in your words)">
            <textarea
              rows={3}
              dir="auto"
              value={p.pricingLogic ?? ''}
              onChange={(e) => setP({ ...p, pricingLogic: e.target.value })}
              placeholder="We scope each project and quote based on features and timeline. Small sites from ~X; larger apps quoted per request."
              className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
            />
          </Field>
          {p.quoteByRequest && (
            <Field label="What should the agent ask before quoting? (comma-separated)">
              <Input
                value={(p.needsInfoToQuote ?? []).join(', ')}
                onChange={(e) =>
                  setP({
                    ...p,
                    needsInfoToQuote: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="project scope, budget, timeline"
              />
            </Field>
          )}
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Card>

      {/* How the agent behaves */}
      <BehaviorControls onChanged={onChanged} />
    </div>
  );
}
