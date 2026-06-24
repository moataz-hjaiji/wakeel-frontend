import { PRESET_ICONS } from './catalog-templates';

export function presetIcon(icon?: string | null): string {
  if (!icon) return '📋';
  return PRESET_ICONS[icon] ?? '📋';
}

export function getEntryFieldValue(
  values: Record<string, unknown>,
  field: { id: string; label: string },
): unknown {
  const byId = values[field.id];
  if (byId !== undefined && byId !== null && byId !== '') return byId;

  const byLabel = values[field.label];
  if (byLabel !== undefined && byLabel !== null && byLabel !== '') return byLabel;

  const labelKey = Object.keys(values).find(
    (k) => k.toLowerCase() === field.label.toLowerCase(),
  );
  if (labelKey && values[labelKey] !== '' && values[labelKey] != null) {
    return values[labelKey];
  }

  return undefined;
}

export function formatEntryValue(
  type: string,
  value: unknown,
  config?: { currency?: string } | null,
): string {
  if (value === undefined || value === null || value === '') return '—';

  if (type === 'toggle') {
    return value === true || value === 'true' ? 'Yes' : 'No';
  }

  if (type === 'price') {
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    const currency = config?.currency ?? 'USD';
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(n);
    } catch {
      return `$${n.toFixed(2)}`;
    }
  }

  return String(value);
}

export function entryTitle(
  fields: Array<{ id: string; label: string; type: string }>,
  values: Record<string, unknown>,
): string {
  const make = fields.find((f) => f.label.toLowerCase() === 'make');
  const model = fields.find((f) => f.label.toLowerCase() === 'model');
  if (make || model) {
    const parts = [make, model]
      .filter(Boolean)
      .map((f) => getEntryFieldValue(values, f!))
      .filter((v) => v != null && String(v).trim());
    if (parts.length) return parts.map(String).join(' ');
  }

  const nameField = fields.find((f) => f.label.toLowerCase() === 'name');
  if (nameField) {
    const name = getEntryFieldValue(values, nameField);
    if (name != null && String(name).trim()) return String(name);
  }

  for (const field of fields) {
    const v = getEntryFieldValue(values, field);
    if (v != null && String(v).trim()) return String(v);
  }

  return 'Untitled item';
}
