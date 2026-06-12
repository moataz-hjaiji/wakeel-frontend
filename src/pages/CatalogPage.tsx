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
import {
  KeyValueEditor,
  attributesToRows,
  rowsToAttributes,
  validateAttributeRows,
  type KeyValueRow,
} from '../components/ui/KeyValueEditor';
import { Modal } from '../components/ui/Modal';
import { ApiError } from '../lib/api';
import { elementService } from '../services/element.service';
import type { CatalogElement, ElementType } from '../types/element';
import { ELEMENT_STATUSES, ELEMENT_TYPES } from '../types/element';

const PAGE_SIZE = 8;

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20';

function formatPrice(price: number | string | null) {
  if (price == null || price === '') return '—';
  const n = typeof price === 'string' ? parseFloat(price) : price;
  return Number.isNaN(n) ? '—' : `$${n.toLocaleString()}`;
}

const typeBadgeColors: Record<ElementType, string> = {
  product: 'bg-blue-100 text-blue-800',
  course: 'bg-purple-100 text-purple-800',
  service: 'bg-emerald-100 text-emerald-800',
  event: 'bg-amber-100 text-amber-800',
};

export function CatalogPage() {
  const { token } = useAuth();

  const [elements, setElements] = useState<CatalogElement[]>([]);
  const [filterType, setFilterType] = useState<ElementType | ''>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ElementType>('product');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [attributeRows, setAttributeRows] = useState<KeyValueRow[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<CatalogElement | null>(null);
  const [editType, setEditType] = useState<ElementType>('product');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive'>('active');
  const [editAttributeRows, setEditAttributeRows] = useState<KeyValueRow[]>([]);
  const [editError, setEditError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const loadElements = useCallback(async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      const data = await elementService.list(token, filterType || undefined);
      setElements(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load catalog');
    } finally {
      setIsLoading(false);
    }
  }, [token, filterType]);

  useEffect(() => {
    loadElements();
  }, [loadElements]);

  const columns = useMemo<DataTableColumn<CatalogElement>[]>(
    () => [
      {
        key: 'type',
        header: 'Type',
        render: (row) => (
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeBadgeColors[row.type]}`}
          >
            {row.type}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Name',
        render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
      },
      {
        key: 'price',
        header: 'Price',
        className: 'whitespace-nowrap',
        render: (row) => formatPrice(row.price),
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) => (
          <span
            className={
              row.status === 'active' ? 'text-emerald-600' : 'text-slate-400'
            }
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'description',
        header: 'Description',
        className: 'max-w-xs',
        render: (row) => row.description ?? '—',
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
      const result = await elementService.importFile(file, token);
      setImportMessage(`Successfully imported ${result.imported} item(s).`);
      await loadElements();
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function buildPayload(rows: KeyValueRow[]) {
    return {
      type,
      name,
      description: description || undefined,
      price: price ? parseFloat(price) : undefined,
      status,
      attributes: rowsToAttributes(rows),
    };
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const attrError = validateAttributeRows(attributeRows);
    if (attrError) {
      setFormError(attrError);
      return;
    }
    setFormError('');
    setIsSubmitting(true);
    try {
      const created = await elementService.create(buildPayload(attributeRows), token);
      setElements((prev) => [created, ...prev]);
      setName('');
      setDescription('');
      setPrice('');
      setAttributeRows([]);
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create item',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function openEditModal(el: CatalogElement) {
    setEditing(el);
    setEditType(el.type);
    setEditName(el.name);
    setEditDescription(el.description ?? '');
    setEditPrice(el.price != null ? String(el.price) : '');
    setEditStatus(el.status);
    setEditAttributeRows(attributesToRows(el.attributes));
    setEditError('');
  }

  function closeEditModal() {
    setEditing(null);
  }

  async function handleUpdate(e: FormEvent) {
    e.preventDefault();
    if (!token || !editing) return;
    const attrError = validateAttributeRows(editAttributeRows);
    if (attrError) {
      setEditError(attrError);
      return;
    }
    setEditError('');
    setIsUpdating(true);
    try {
      const updated = await elementService.update(
        editing.id,
        {
          type: editType,
          name: editName,
          description: editDescription || undefined,
          price: editPrice ? parseFloat(editPrice) : undefined,
          status: editStatus,
          attributes: rowsToAttributes(editAttributeRows),
        },
        token,
      );
      setElements((prev) => prev.map((el) => (el.id === updated.id ? updated : el)));
      closeEditModal();
    } catch (err) {
      setEditError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update item',
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleBulkDelete(ids: string[]) {
    if (!token) return;
    if (!window.confirm(`Delete ${ids.length} item(s)? This cannot be undone.`)) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(ids.map((id) => elementService.remove(id, token)));
      setElements((prev) => prev.filter((el) => !ids.includes(el.id)));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete items');
    } finally {
      setIsBulkDeleting(false);
    }
  }

  async function handleDelete(el: CatalogElement) {
    if (!token) return;
    if (!window.confirm(`Delete "${el.name}"?`)) return;
    setDeletingId(el.id);
    try {
      await elementService.remove(el.id, token);
      setElements((prev) => prev.filter((e) => e.id !== el.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Failed to delete');
    } finally {
      setDeletingId(null);
    }
  }

  const formFields = (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ElementType)}
            className={inputClass}
          >
            {ELEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
            className={inputClass}
          >
            {ELEMENT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Name</label>
        <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Description</label>
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Price</label>
        <input type="number" step="0.01" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} placeholder="32999.99" />
      </div>
      <KeyValueEditor rows={attributeRows} onChange={setAttributeRows} />
    </>
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalog</h1>
          <p className="mt-1 text-sm text-slate-500">
            Products, courses, services, events — one flexible catalog
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ElementType | '')}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="">All types</option>
            {ELEMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImport} />
          <button type="button" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
            {isImporting ? 'Importing…' : 'Import CSV/Excel'}
          </button>
          <button type="button" onClick={() => { setShowForm((v) => !v); setFormError(''); }} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            {showForm ? 'Cancel' : '+ New item'}
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-slate-800">Import columns</p>
            <p className="mt-1">
              <strong>name</strong> (required), <strong>type</strong> (product/course/service/event),{' '}
              <strong>description</strong>, <strong>price</strong>, <strong>status</strong> (active/inactive),{' '}
              <strong>attributes</strong> (JSON text — for cars use make, model, year, mileage, etc.)
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <a
              href="/samples/sample-car-store.xlsx"
              download="sample-car-store.xlsx"
              className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Car store example
            </a>
            <a
              href="/samples/sample-elements.xlsx"
              download="sample-elements.xlsx"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              General example
            </a>
          </div>
        </div>
      </div>

      {importMessage && <div className="mb-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{importMessage}</div>}
      {importError && <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{importError}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Add catalog item</h2>
          <div className="mt-4 space-y-4">{formFields}</div>
          {formError && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">{error}</p>
          <button type="button" onClick={loadElements} className="mt-3 text-sm font-medium text-red-800 underline">Try again</button>
        </div>
      ) : (
        <DataTable
          data={elements}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          emptyMessage="No catalog items yet."
          selectable
          onBulkDelete={handleBulkDelete}
          isBulkDeleting={isBulkDeleting}
          actions={(el) => (
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => openEditModal(el)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">Edit</button>
              <button type="button" disabled={deletingId === el.id} onClick={() => handleDelete(el)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">
                {deletingId === el.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )}
        />
      )}

      <Modal open={!!editing} title="Edit catalog item" onClose={closeEditModal}>
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select value={editType} onChange={(e) => setEditType(e.target.value as ElementType)} className={inputClass}>
                {ELEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as 'active' | 'inactive')} className={inputClass}>
                {ELEMENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input type="text" required value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Description</label>
            <textarea rows={2} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Price</label>
            <input type="number" step="0.01" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className={inputClass} />
          </div>
          <KeyValueEditor rows={editAttributeRows} onChange={setEditAttributeRows} />
          {editError && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{editError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeEditModal} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={isUpdating} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
              {isUpdating ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
