import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { trainingService } from '../../../services/training.service';
import type { BusinessKnowledge, TrainingDocument } from '../../../types/training';
import { Button, Card } from '../../../components/ui/primitives';
import { KnowledgeEntryCard } from '../components/KnowledgeEntryCard';

/** Upload text documents (menu PDFs, notes). Structured catalogs belong in Catalog. */
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
        Upload a menu, price list, or notes. We extract readable facts for your agent. For product
        spreadsheets (Excel/CSV), use the{' '}
        <Link to="/dashboard/catalog" className="font-medium text-brand hover:underline">
          Catalog
        </Link>{' '}
        page instead — it imports rows as products.
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
    const t = setTimeout(load, 3000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc.id, token]);

  async function editEntry(id: string, topic: string, content: string) {
    if (!token) return;
    const nextTopic = window.prompt('Topic / title:', topic);
    if (nextTopic == null) return;
    const nextContent = window.prompt('Details:', content);
    if (nextContent == null) return;
    await trainingService.updateKnowledge(
      id,
      { topic: nextTopic.trim(), content: nextContent.trim() },
      token,
    );
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
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-text">📄 {doc.filename}</span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 text-[12px] font-medium text-danger hover:underline"
        >
          Remove file
        </button>
      </div>

      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-text-subtle">
        Extracted for the agent
      </p>
      <div className="mt-1.5 space-y-2">
        {entries == null ? (
          <p className="text-[12px] text-text-subtle">Reading the file…</p>
        ) : entries.length === 0 ? (
          <p className="text-[12px] text-text-subtle">
            Nothing extracted yet (or the file had no readable text).
          </p>
        ) : (
          entries.map((e) => (
            <KnowledgeEntryCard
              key={e.id}
              topic={e.topic}
              content={e.content}
              source="document"
              onEdit={() => editEntry(e.id, e.topic, e.content)}
              onDelete={() => del(e.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
