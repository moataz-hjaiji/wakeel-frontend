import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type {
  Collection,
  CollectionEntry,
  CollectionField,
  CollectionPreset,
  FieldType,
} from '../../../types/training';
import { Button, Card, Field, Input, Select } from '../../../components/ui/primitives';
import type { SectionProps } from '../TrainingPage';
import { FilesPanel } from './FilesPanel';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'long_text', label: 'Long text' },
  { value: 'number', label: 'Number' },
  { value: 'price', label: 'Price' },
  { value: 'toggle', label: 'Yes / No' },
  { value: 'single_select', label: 'Pick one' },
  { value: 'multi_select', label: 'Pick many' },
  { value: 'image', label: 'Image URL' },
];

export function CatalogSection({ onChanged }: SectionProps) {
  const { token } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [presets, setPresets] = useState<CollectionPreset[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const loadCollections = useCallback(() => {
    if (!token) return;
    trainingService.listCollections(token).then((cols) => {
      setCollections(cols);
      setActiveId((cur) => cur ?? cols[0]?.id ?? null);
    });
  }, [token]);

  useEffect(() => {
    loadCollections();
    if (token) trainingService.presets(token).then(setPresets);
  }, [loadCollections, token]);

  async function createCollection(preset: CollectionPreset) {
    if (!token) return;
    const col = await trainingService.createCollection(
      { name: preset.name, icon: preset.icon, preset: preset.key },
      token,
    );
    setCreating(false);
    setActiveId(col.id);
    loadCollections();
    onChanged();
  }

  async function deleteCollection(id: string) {
    if (!token) return;
    if (!window.confirm('Delete this collection and all its items?')) return;
    await trainingService.deleteCollection(id, token);
    setActiveId(null);
    loadCollections();
    onChanged();
  }

  if (creating || collections.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <h3 className="text-[15px] font-semibold text-text">
            Have a fixed list of items? Add it here (optional).
          </h3>
          <p className="mt-0.5 text-[13px] text-text-muted">
            Products, dishes, services with set prices. Pick the closest starting point — it just
            sets up sensible columns, and you can change everything afterwards. If your pricing
            depends on the request, skip this and set that up in <strong>Business basics</strong>.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {presets.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => createCollection(p)}
                className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2.5 text-start transition-colors hover:bg-surface-muted"
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-[13px] font-medium text-text">{p.name}</span>
              </button>
            ))}
          </div>
          {collections.length > 0 && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={() => setCreating(false)}>
              Cancel
            </Button>
          )}
        </Card>
        <FilesPanel onChanged={onChanged} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collection tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
              activeId === c.id
                ? 'bg-brand text-white'
                : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          + New
        </Button>
      </div>

      {activeId && (
        <CollectionEditor
          key={activeId}
          collectionId={activeId}
          onChanged={onChanged}
          onDelete={() => deleteCollection(activeId)}
        />
      )}

      <FilesPanel onChanged={onChanged} />
    </div>
  );
}

// ── Single collection: fields + entries ──────────────────────────────────────
function CollectionEditor({
  collectionId,
  onChanged,
  onDelete,
}: {
  collectionId: string;
  onChanged: () => void;
  onDelete: () => void;
}) {
  const { token } = useAuth();
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [advanced, setAdvanced] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');

  const load = useCallback(() => {
    if (!token) return;
    trainingService.listFields(collectionId, token).then(setFields);
    trainingService.listEntries(collectionId, token).then(setEntries);
  }, [collectionId, token]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Fields ──
  async function addField() {
    if (!token) return;
    await trainingService.createField(
      collectionId,
      { label: 'New field', type: 'text', visibility: 'agent_visible', quoteMode: 'paraphrase' },
      token,
    );
    load();
    onChanged();
  }
  async function patchField(id: string, body: Partial<CollectionField>) {
    if (!token) return;
    await trainingService.updateField(collectionId, id, body, token);
    load();
    onChanged();
  }
  async function deleteField(id: string) {
    if (!token) return;
    await trainingService.deleteField(collectionId, id, token);
    load();
    onChanged();
  }

  // ── Entries ──
  async function submitEntry() {
    if (!token) return;
    if (editingId) {
      await trainingService.updateEntry(collectionId, editingId, draft, token);
    } else {
      await trainingService.createEntry(collectionId, draft, token);
    }
    setDraft({});
    setEditingId(null);
    load();
    onChanged();
  }
  async function deleteEntry(id: string) {
    if (!token) return;
    await trainingService.deleteEntry(collectionId, id, token);
    load();
    onChanged();
  }
  function editEntry(entry: CollectionEntry) {
    setEditingId(entry.id);
    setDraft(entry.values);
  }

  async function importFile(file: File) {
    if (!token) return;
    setImportMsg('');
    const res = await trainingService.importEntries(collectionId, token, { file });
    setImportMsg(`Imported ${res.imported} item(s).`);
    load();
    onChanged();
  }

  return (
    <div className="space-y-4">
      {/* Fields manager */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[15px] font-semibold text-text">
              What do you record for each one?
            </h3>
            <p className="mt-0.5 text-[13px] text-text-muted">
              These are the columns for every item below — like name, price, photo. We've added
              the usual ones; rename or add your own.
            </p>
          </div>
          <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-text-muted">
            <input
              type="checkbox"
              checked={advanced}
              onChange={(e) => setAdvanced(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-border-strong text-brand focus:ring-brand"
            />
            More options
          </label>
        </div>

        <div className="mt-3 space-y-2">
          {fields.map((f) => (
            <div key={f.id} className="flex flex-wrap items-center gap-2">
              <Input
                value={f.label}
                onChange={(e) => setFields((fs) => fs.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)))}
                onBlur={(e) => patchField(f.id, { label: e.target.value })}
                className="w-44"
              />
              {/* Advanced controls — hidden by default so the common case is just
                  "name your columns". Plain labels + a legend below explain them. */}
              {advanced && (
                <>
                  <Select
                    value={f.type}
                    onChange={(e) => patchField(f.id, { type: e.target.value as FieldType })}
                    className="w-32"
                  >
                    {FIELD_TYPES.map((ft) => (
                      <option key={ft.value} value={ft.value}>
                        {ft.label}
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() =>
                      patchField(f.id, {
                        visibility: f.visibility === 'internal' ? 'agent_visible' : 'internal',
                      })
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      f.visibility === 'internal'
                        ? 'bg-surface-muted text-text-subtle'
                        : 'bg-brand-soft text-brand'
                    }`}
                    title="Whether the agent can tell customers this"
                  >
                    {f.visibility === 'internal' ? 'Hidden from agent' : 'Agent can share'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      patchField(f.id, {
                        quoteMode: f.quoteMode === 'exact' ? 'paraphrase' : 'exact',
                      })
                    }
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      f.quoteMode === 'exact'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-surface-muted text-text-subtle'
                    }`}
                    title="Exact = agent repeats it word-for-word (use for prices)"
                  >
                    {f.quoteMode === 'exact' ? 'Word-for-word' : 'Can reword'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => deleteField(f.id)}
                className="text-[12px] font-medium text-danger hover:underline"
                title="Remove this column"
              >
                ✕
              </button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={addField}>
            + Add a column
          </Button>
        </div>

        {advanced && (
          <p className="mt-3 border-t border-border pt-2.5 text-[11px] leading-relaxed text-text-subtle">
            <strong className="text-text-muted">Agent can share / Hidden from agent</strong> — whether
            customers can be told this (hide cost, supplier, etc.).{' '}
            <strong className="text-text-muted">Word-for-word / Can reword</strong> — set prices &
            availability to word-for-word so they're never changed.
          </p>
        )}
      </Card>

      {/* Auto-generated item form */}
      <Card>
        <h3 className="text-[15px] font-semibold text-text">
          {editingId ? 'Edit item' : 'Add an item'}
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <Field key={f.id} label={f.label}>
              <EntryFieldInput
                field={f}
                value={draft[f.id]}
                onChange={(v) => setDraft((d) => ({ ...d, [f.id]: v }))}
              />
            </Field>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={submitEntry}>{editingId ? 'Save' : 'Add'}</Button>
          {editingId && (
            <Button
              variant="secondary"
              onClick={() => {
                setEditingId(null);
                setDraft({});
              }}
            >
              Cancel
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) importFile(file);
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Import CSV
          </Button>
        </div>
        {importMsg && <p className="mt-2 text-[13px] text-brand">{importMsg}</p>}
      </Card>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-[13px]">
                {fields
                  .filter((f) => entry.values[f.id] !== undefined && entry.values[f.id] !== '')
                  .map((f) => (
                    <span key={f.id} className="me-3 text-text">
                      <span className="text-text-subtle">{f.label}:</span>{' '}
                      {String(entry.values[f.id])}
                    </span>
                  ))}
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="sm" onClick={() => editEntry(entry)}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => deleteEntry(entry.id)}
                  className="border-danger/30 text-danger hover:bg-danger-soft"
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {entries.length === 0 && (
          <p className="px-1 text-[13px] text-text-subtle">No items yet.</p>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        className="text-[12px] font-medium text-danger hover:underline"
      >
        Delete this collection
      </button>
    </div>
  );
}

// ── Auto field input by type ──────────────────────────────────────────────────
function EntryFieldInput({
  field,
  value,
  onChange,
}: {
  field: CollectionField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  switch (field.type) {
    case 'toggle':
      return (
        <label className="flex h-9 items-center gap-2 text-[13px] text-text">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
          />
          {value === true ? 'Yes' : 'No'}
        </label>
      );
    case 'long_text':
      return (
        <textarea
          rows={2}
          dir="auto"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] text-text focus-visible:border-brand focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-ring"
        />
      );
    case 'number':
    case 'price':
      return (
        <Input
          type="number"
          value={(value as number | string) ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      );
    default:
      return (
        <Input
          dir="auto"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
