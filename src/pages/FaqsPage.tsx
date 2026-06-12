import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DataTable, type DataTableColumn } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { ApiError } from '../lib/api';
import { faqService } from '../services/faq.service';
import type { Faq } from '../types/faq';

const PAGE_SIZE = 8;

export function FaqsPage() {
  const { token } = useAuth();

  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadFaqs = useCallback(async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      const data = await faqService.list(token);
      setFaqs(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load Q&A');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadFaqs();
  }, [loadFaqs]);

  const columns = useMemo<DataTableColumn<Faq>[]>(
    () => [
      {
        key: 'question',
        header: 'Question',
        className: 'max-w-xs',
        render: (row) => <span className="font-medium text-slate-900">{row.question}</span>,
      },
      {
        key: 'answer',
        header: 'Answer',
        className: 'max-w-md',
        render: (row) => row.answer,
      },
      {
        key: 'createdAt',
        header: 'Created',
        className: 'whitespace-nowrap',
        render: (row) => (
          <span className="text-slate-500">
            {new Date(row.createdAt).toLocaleDateString()}
          </span>
        ),
      },
    ],
    [],
  );

  async function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setImportError('');
    setImportMessage('');
    setIsImporting(true);

    try {
      const result = await faqService.importFile(file, token);
      setImportMessage(`Successfully imported ${result.imported} Q&A item(s).`);
      await loadFaqs();
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    setFormError('');
    setIsSubmitting(true);

    try {
      const created = await faqService.create({ question, answer }, token);
      setFaqs((prev) => [created, ...prev]);
      setQuestion('');
      setAnswer('');
      setShowForm(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to create Q&A');
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(faq: Faq) {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditError('');
  }

  function closeEditModal() {
    setEditingFaq(null);
    setEditQuestion('');
    setEditAnswer('');
    setEditError('');
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingFaq) return;

    setEditError('');
    setIsUpdating(true);

    try {
      const updated = await faqService.update(
        editingFaq.id,
        { question: editQuestion, answer: editAnswer },
        token,
      );
      setFaqs((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      closeEditModal();
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Failed to update Q&A');
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleBulkDelete(ids: string[]) {
    if (!token) return;
    const confirmed = window.confirm(
      `Delete ${ids.length} Q&A item(s)? This cannot be undone.`,
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => faqService.remove(id, token)));
      setFaqs((prev) => prev.filter((f) => !ids.includes(f.id)));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete Q&A items');
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleDelete(faq: Faq) {
    if (!token) return;
    const confirmed = window.confirm(`Delete this Q&A?\n\n"${faq.question}"`);
    if (!confirmed) return;

    setDeletingId(faq.id);
    try {
      await faqService.remove(faq.id, token);
      setFaqs((prev) => prev.filter((f) => f.id !== faq.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete Q&A');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Q&A</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage frequently asked questions for your chatbot
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
          <button
            type="button"
            disabled={isImporting}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isImporting ? 'Importing…' : 'Import CSV/Excel'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowForm((v) => !v);
              setFormError('');
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {showForm ? 'Cancel' : '+ New Q&A'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Bulk import format</p>
        <p className="mt-1">
          File must have columns <strong>question</strong> and <strong>answer</strong>.
          All rows are inserted in one transaction.
        </p>
      </div>

      {importMessage && (
        <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          {importMessage}
        </div>
      )}
      {importError && (
        <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {importError}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Add Q&A</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="faq-question" className="block text-sm font-medium text-slate-700">
                Question
              </label>
              <input
                id="faq-question"
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What are your opening hours?"
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label htmlFor="faq-answer" className="block text-sm font-medium text-slate-700">
                Answer
              </label>
              <textarea
                id="faq-answer"
                required
                rows={3}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="We are open Mon–Fri 9am–6pm."
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {formError && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isSubmitting ? 'Saving…' : 'Save Q&A'}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={loadFaqs}
            className="mt-3 text-sm font-medium text-red-800 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <DataTable
          data={faqs}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage="No Q&A yet. Add one or import from CSV/Excel."
          selectable
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={isBulkDeleting}
          bulkDeleteLabel="Delete selected"
          actions={(faq) => (
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => openEditModal(faq)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                disabled={deletingId === faq.id}
                onClick={() => handleDelete(faq)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deletingId === faq.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        />
      )}

      <Modal open={!!editingFaq} title="Edit Q&A" onClose={closeEditModal}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="edit-question" className="block text-sm font-medium text-slate-700">
              Question
            </label>
            <input
              id="edit-question"
              type="text"
              required
              value={editQuestion}
              onChange={(e) => setEditQuestion(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <div>
            <label htmlFor="edit-answer" className="block text-sm font-medium text-slate-700">
              Answer
            </label>
            <textarea
              id="edit-answer"
              required
              rows={3}
              value={editAnswer}
              onChange={(e) => setEditAnswer(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {editError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {isUpdating ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
