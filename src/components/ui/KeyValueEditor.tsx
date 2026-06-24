export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
}

const rowInputClass =
  'h-9 w-full rounded-[10px] border border-border bg-surface px-3 text-[13px] text-text ' +
  'placeholder:text-text-subtle focus-visible:border-brand focus-visible:outline-none ' +
  'focus-visible:ring-[3px] focus-visible:ring-brand-ring';

function newRow(): KeyValueRow {
  return { id: crypto.randomUUID(), key: '', value: '' };
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function parseAttributeValue(raw: string): unknown {
  const v = raw.trim();
  if (v === '') return '';
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (!Number.isNaN(Number(v)) && v !== '') return Number(v);
  if ((v.startsWith('{') && v.endsWith('}')) || (v.startsWith('[') && v.endsWith(']'))) {
    try {
      return JSON.parse(v);
    } catch {
      return raw;
    }
  }
  return raw;
}

export function attributesToRows(
  attrs: Record<string, unknown> | null | undefined,
): KeyValueRow[] {
  if (!attrs) return [];
  return Object.entries(attrs).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value: formatAttributeValue(value),
  }));
}

export function rowsToAttributes(rows: KeyValueRow[]): Record<string, unknown> | undefined {
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    result[key] = parseAttributeValue(row.value);
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

export function validateAttributeRows(rows: KeyValueRow[]): string | null {
  const seen = new Set<string>();
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) continue;
    if (seen.has(key)) return `Duplicate attribute key: "${key}"`;
    seen.add(key);
  }
  return null;
}

interface KeyValueEditorProps {
  rows: KeyValueRow[];
  onChange: (rows: KeyValueRow[]) => void;
}

export function KeyValueEditor({ rows, onChange }: KeyValueEditorProps) {
  function updateRow(id: string, field: 'key' | 'value', next: string) {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: next } : row)));
  }

  function removeRow(id: string) {
    onChange(rows.filter((row) => row.id !== id));
  }

  function addRow() {
    onChange([...rows, newRow()]);
  }

  return (
    <div>
      <label className="block text-[13px] font-medium text-text-muted">Attributes</label>
      <div className="mt-2 space-y-2">
        {rows.length === 0 ? (
          <p className="text-[13px] text-text-subtle">No attributes yet.</p>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <input
                type="text"
                value={row.key}
                onChange={(e) => updateRow(row.id, 'key', e.target.value)}
                placeholder="Key"
                className={rowInputClass}
              />
              <span className="shrink-0 text-text-subtle">:</span>
              <input
                type="text"
                value={row.value}
                onChange={(e) => updateRow(row.id, 'value', e.target.value)}
                placeholder="Value"
                className={rowInputClass}
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="h-9 shrink-0 rounded-[10px] border border-danger/30 px-2.5 text-[13px] font-medium text-danger hover:bg-danger-soft"
                aria-label="Remove attribute"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-[13px] font-medium text-brand hover:underline"
      >
        + Add attribute
      </button>
    </div>
  );
}
