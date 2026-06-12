export interface KeyValueRow {
  id: string;
  key: string;
  value: string;
}

const rowInputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

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
      <label className="block text-sm font-medium text-slate-700">Attributes</label>
      <div className="mt-2 space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400">No attributes yet.</p>
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
              <span className="shrink-0 text-slate-400">:</span>
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
                className="shrink-0 rounded-lg border border-red-200 px-2.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
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
        className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        + Add attribute
      </button>
    </div>
  );
}
