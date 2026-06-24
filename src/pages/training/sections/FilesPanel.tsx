import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { BusinessKnowledge, TrainingDocument } from '../../../types/training';
import { Button, Card } from '../../../components/ui/primitives';

/** Upload files; for each, show the EDITABLE knowledge the agent extracted from
 *  it. Lives inside the Catalog tab. */
export function FilesPanel({ onChanged }: { onChanged: () => void }) {
  const { token } = useAuth();
  const [docs, setDocs] = useState<TrainingDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => token && trainingService.listDocuments(token).then(setDocs);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function upload(file: File) {
    if (!token) return;
    setUploading(true);
    try {
      await trainingService.uploadDocument(file, token);
      load();
      onChanged();
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!token) return;
    await trainingService.deleteDocument(id, token);
    load();
    onChanged();
  }

  return (
    <Card>
      <h3 className="text-[15px] font-semibold text-text">Files (optional)</h3>
      <p className="mt-0.5 text-[13px] text-text-muted">
        Upload a menu or price list. We pull out the facts your agent can use and show them below —
        editable. (Your catalog and the rest always come first; files are a backup source.)
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={`mt-3 flex flex-col items-center justify-center rounded-[10px] border border-dashed px-4 py-6 text-center transition-colors ${
          dragging ? 'border-brand bg-brand-soft' : 'border-border bg-surface-muted'
        }`}
      >
        <p className="text-[13px] text-text-muted">
          {uploading ? 'Uploading & reading…' : 'Drag a file here, or'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            if (inputRef.current) inputRef.current.value = '';
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          className="mt-2"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        {docs.map((d) => (
          <FileEntry key={d.id} doc={d} onRemove={() => remove(d.id)} onChanged={onChanged} />
        ))}
      </div>
    </Card>
  );
}

/** One file + its editable extracted knowledge entries. */
function FileEntry({
  doc,
  onRemove,
  onChanged,
}: {
  doc: TrainingDocument;
  onRemove: () => void;
  onChanged: () => void;
}) {
  const { token } = useAuth();
  const [entries, setEntries] = useState<BusinessKnowledge[] | null>(null);

  const load = () =>
    token && trainingService.documentKnowledge(doc.id, token).then(setEntries);
  useEffect(() => {
    load();
    // Re-poll once after a moment in case extraction is still running.
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, token]);

  async function save(id: string, topic: string, content: string) {
    if (!token) return;
    await trainingService.updateKnowledge(id, { topic, content }, token);
    load();
    onChanged();
  }
  async function del(id: string) {
    if (!token) return;
    await trainingService.deleteKnowledge(id, token);
    load();
    onChanged();
  }

  return (
    <div className="rounded-[10px] border border-border p-3">
      <div className="flex items-center justify-between">
        <span className="truncate text-[13px] font-medium text-text">📄 {doc.filename}</span>
        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] font-medium text-danger hover:underline"
        >
          Remove
        </button>
      </div>

      <p className="mt-1.5 text-[11px] font-medium text-text-subtle">
        What the agent uses from this file:
      </p>
      <div className="mt-1 space-y-1.5">
        {entries == null ? (
          <p className="text-[12px] text-text-subtle">Reading the file…</p>
        ) : entries.length === 0 ? (
          <p className="text-[12px] text-text-subtle">
            Nothing extracted yet (or the file had no readable text).
          </p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="flex items-start gap-2 rounded-md bg-surface-muted px-2.5 py-1.5">
              <input
                value={e.topic}
                onChange={(ev) =>
                  setEntries((es) => es!.map((x) => (x.id === e.id ? { ...x, topic: ev.target.value } : x)))
                }
                onBlur={(ev) => save(e.id, ev.target.value, e.content)}
                className="w-32 shrink-0 rounded border border-transparent bg-transparent px-1 text-[12px] font-medium text-text hover:border-border focus:border-brand focus:outline-none"
              />
              <input
                value={e.content}
                onChange={(ev) =>
                  setEntries((es) => es!.map((x) => (x.id === e.id ? { ...x, content: ev.target.value } : x)))
                }
                onBlur={(ev) => save(e.id, e.topic, ev.target.value)}
                className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 text-[12px] text-text-muted hover:border-border focus:border-brand focus:outline-none"
                dir="auto"
              />
              <button
                type="button"
                onClick={() => del(e.id)}
                className="shrink-0 text-[12px] text-text-subtle hover:text-danger"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
