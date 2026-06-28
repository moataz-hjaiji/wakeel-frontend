import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type {
  OperatingHours,
  Policy,
  PolicyKind,
  ServiceZone,
  WeekHours,
  WeekKey,
} from '../../../types/training';
import { defaultWeek, normalizeWeekHours } from '../lib/hours';
import { Button, Card, Field, Input, Select } from '../../../components/ui/primitives';
import type { SectionProps } from '../TrainingPage';

const DAYS: { key: WeekKey; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export function OperatingSection({ onChanged }: SectionProps) {
  const { token } = useAuth();

  // Hours
  const [hours, setHours] = useState<Partial<OperatingHours>>({
    timezone: 'Africa/Tunis',
    week: defaultWeek(),
    exceptions: [],
  });
  const [hoursSaved, setHoursSaved] = useState(false);

  // Zones + policies
  const [zones, setZones] = useState<ServiceZone[]>([]);
  const [zoneArea, setZoneArea] = useState('');
  const [zoneFee, setZoneFee] = useState('');
  const [zoneCond, setZoneCond] = useState('');

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [polKind, setPolKind] = useState<PolicyKind>('returns');
  const [polTitle, setPolTitle] = useState('');
  const [polBody, setPolBody] = useState('');

  useEffect(() => {
    if (!token) return;
    trainingService.getHours(token).then((h) => {
      if (h) {
        setHours({
          ...h,
          week: normalizeWeekHours(h.week),
          exceptions: h.exceptions ?? [],
        });
      }
    });
    trainingService.listZones(token).then(setZones);
    trainingService.listPolicies(token).then(setPolicies);
  }, [token]);

  const week = normalizeWeekHours(hours.week);

  function setDay(key: WeekKey, patch: Partial<WeekHours[WeekKey]>) {
    const current = week[key];
    const next = { ...week, [key]: { ...current, ...patch } };
    setHours({ ...hours, week: next });
  }

  async function saveHours() {
    if (!token) return;
    await trainingService.saveHours(
      { timezone: hours.timezone, week: hours.week, exceptions: hours.exceptions },
      token,
    );
    setHoursSaved(true);
    onChanged();
  }

  async function addZone() {
    if (!token || !zoneArea.trim()) return;
    await trainingService.createZone(
      {
        area: zoneArea,
        fee: zoneFee ? Number(zoneFee) : undefined,
        feeCurrency: 'TND',
        conditions: zoneCond || undefined,
      },
      token,
    );
    setZoneArea('');
    setZoneFee('');
    setZoneCond('');
    trainingService.listZones(token).then(setZones);
    onChanged();
  }

  async function removeZone(id: string) {
    if (!token) return;
    await trainingService.deleteZone(id, token);
    trainingService.listZones(token).then(setZones);
    onChanged();
  }

  async function addPolicy() {
    if (!token || !polTitle.trim() || !polBody.trim()) return;
    await trainingService.createPolicy({ kind: polKind, title: polTitle, body: polBody }, token);
    setPolTitle('');
    setPolBody('');
    trainingService.listPolicies(token).then(setPolicies);
    onChanged();
  }

  async function removePolicy(id: string) {
    if (!token) return;
    await trainingService.deletePolicy(id, token);
    trainingService.listPolicies(token).then(setPolicies);
    onChanged();
  }

  return (
    <div className="space-y-4">
      {/* Hours */}
      <Card>
        <h3 className="text-[15px] font-semibold text-text">Opening hours</h3>
        <p className="mt-0.5 text-[13px] text-text-muted">
          Your agent tells customers whether you're open right now.
        </p>
        <div className="mt-4 space-y-2">
          {DAYS.map((d) => {
            const day = week[d.key];
            return (
              <div key={d.key} className="flex items-center gap-3">
                <span className="w-10 text-[13px] font-medium text-text">{d.label}</span>
                <label className="flex items-center gap-1.5 text-[13px] text-text-muted">
                  <input
                    type="checkbox"
                    checked={!day.closed}
                    onChange={(e) => setDay(d.key, { closed: !e.target.checked })}
                    className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                  />
                  Open
                </label>
                {!day.closed && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      value={day.ranges[0]?.open ?? '09:00'}
                      onChange={(e) =>
                        setDay(d.key, {
                          ranges: [{ open: e.target.value, close: day.ranges[0]?.close ?? '17:00' }],
                        })
                      }
                      className="w-auto"
                    />
                    <span className="text-text-subtle">–</span>
                    <Input
                      type="time"
                      value={day.ranges[0]?.close ?? '17:00'}
                      onChange={(e) =>
                        setDay(d.key, {
                          ranges: [{ open: day.ranges[0]?.open ?? '09:00', close: e.target.value }],
                        })
                      }
                      className="w-auto"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={saveHours}>Save hours</Button>
          {hoursSaved && <span className="text-[13px] text-brand">Saved to draft</span>}
        </div>
      </Card>

      {/* Zones */}
      <Card>
        <h3 className="text-[15px] font-semibold text-text">Delivery / service areas</h3>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Field label="Area">
            <Input value={zoneArea} onChange={(e) => setZoneArea(e.target.value)} placeholder="La Marsa" />
          </Field>
          <Field label="Fee">
            <Input
              type="number"
              value={zoneFee}
              onChange={(e) => setZoneFee(e.target.value)}
              placeholder="6"
              className="w-24"
            />
          </Field>
          <Field label="Conditions">
            <Input
              value={zoneCond}
              onChange={(e) => setZoneCond(e.target.value)}
              placeholder="min order 20 TND"
            />
          </Field>
          <Button onClick={addZone} disabled={!zoneArea.trim()}>
            Add
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          {zones.map((z) => (
            <div
              key={z.id}
              className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-1.5 text-[13px]"
            >
              <span className="text-text">
                {z.area}
                {z.fee != null && ` — ${z.fee} ${z.feeCurrency ?? ''}`}
                {z.conditions && ` · ${z.conditions}`}
              </span>
              <button
                type="button"
                onClick={() => removeZone(z.id)}
                className="text-[12px] font-medium text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Policies */}
      <Card>
        <h3 className="text-[15px] font-semibold text-text">Policies</h3>
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Type">
              <Select
                value={polKind}
                onChange={(e) => setPolKind(e.target.value as PolicyKind)}
                className="w-auto"
              >
                <option value="returns">Returns</option>
                <option value="payment">Payment</option>
                <option value="booking">Booking</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Title">
              <Input value={polTitle} onChange={(e) => setPolTitle(e.target.value)} placeholder="Payment" />
            </Field>
          </div>
          <Field label="Details">
            <Input
              value={polBody}
              onChange={(e) => setPolBody(e.target.value)}
              placeholder="Cash on delivery or card in-store."
            />
          </Field>
          <Button onClick={addPolicy} disabled={!polTitle.trim() || !polBody.trim()}>
            Add
          </Button>
        </div>
        <div className="mt-3 space-y-1.5">
          {policies.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-1.5 text-[13px]"
            >
              <span className="text-text">
                <span className="text-text-subtle">[{p.kind}]</span> {p.title}: {p.body}
              </span>
              <button
                type="button"
                onClick={() => removePolicy(p.id)}
                className="text-[12px] font-medium text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
