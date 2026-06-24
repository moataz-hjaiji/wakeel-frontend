import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { catalogService } from '../../services/catalog.service';
import type { Collection, CollectionEntry, CollectionField } from '../../types/training';
import { Button, Card, Field } from '../../components/ui/primitives';
import { Modal } from '../../components/ui/Modal';
import { presetIcon, getEntryFieldValue, formatEntryValue, entryTitle } from './lib/catalog-utils';
import { CatalogPresetPicker, useCatalogPresets } from './CatalogPresetPicker';
import { CatalogFieldsPanel } from './CatalogFieldsPanel';
import { CatalogImportPanel } from './CatalogImportPanel';
import { ProductFieldInput } from './ProductFieldInput';

const PAGE_SIZE = 15;

export function CatalogPage() {
  const { token } = useAuth();
  const { t } = useI18n();
  const presets = useCatalogPresets(token);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [fields, setFields] = useState<CollectionField[]>([]);
  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CollectionEntry | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSetup, setShowSetup] = useState(false);

  const activeCollection = collections.find((c) => c.id === activeId) ?? null;
  const presetKey = presets.find((p) => p.name === activeCollection?.name)?.key;

  const loadCollections = useCallback(() => {
    if (!token) return;
    catalogService.listCollections(token).then((cols) => {
      setCollections(cols);
      setActiveId((cur) => (cur && cols.some((c) => c.id === cur) ? cur : cols[0]?.id ?? null));
      if (cols.length === 0) setCreating(true);
    });
  }, [token]);

  const loadEntries = useCallback(() => {
    if (!token || !activeId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      catalogService.listFields(activeId, token),
      catalogService.listEntries(activeId, token, { page, limit: PAGE_SIZE, status: 'all' }),
    ])
      .then(([f, res]) => {
        setFields(f);
        setEntries(res.items);
        setTotal(res.total);
        setTotalPages(res.totalPages);
      })
      .finally(() => setLoading(false));
  }, [token, activeId, page]);

  useEffect(() => {
    loadCollections();
  }, [loadCollections]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
    setShowSetup(false);
  }, [activeId]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const visibleFields = useMemo(
    () => fields.filter((f) => f.visibility !== 'internal'),
    [fields],
  );

  const tableColumns = useMemo(() => visibleFields.slice(0, 4), [visibleFields]);

  function openCreate() {
    setEditing(null);
    setDraft({});
    setModalOpen(true);
  }

  function openEdit(entry: CollectionEntry) {
    setEditing(entry);
    setDraft({ ...entry.values });
    setModalOpen(true);
  }

  async function saveProduct() {
    if (!token || !activeId) return;
    setSaving(true);
    try {
      if (editing) {
        await catalogService.updateEntry(activeId, editing.id, draft, token);
      } else {
        await catalogService.createEntry(activeId, draft, token);
      }
      setModalOpen(false);
      loadEntries();
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    if (!token || !activeId) return;
    if (!window.confirm(t('catalog.confirmDelete'))) return;
    await catalogService.deleteEntry(activeId, id, token);
    loadEntries();
  }

  async function bulkDelete() {
    if (!token || !activeId || selected.size === 0) return;
    if (!window.confirm(t('catalog.confirmBulkDelete', { count: String(selected.size) }))) return;
    await catalogService.bulkDelete(activeId, [...selected], token);
    setSelected(new Set());
    loadEntries();
  }

  async function deleteCollection() {
    if (!token || !activeId) return;
    if (!window.confirm(t('catalog.confirmDeleteCatalog'))) return;
    await catalogService.deleteCollection(activeId, token);
    setActiveId(null);
    loadCollections();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleCollectionCreated(id: string) {
    setCreating(false);
    setActiveId(id);
    loadCollections();
  }

  if (creating || collections.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-text-muted">{t('catalog.subtitle')}</p>
        {token && (
          <CatalogPresetPicker
            token={token}
            presets={presets}
            hasCollections={collections.length > 0}
            onCreated={handleCollectionCreated}
            onCancel={collections.length > 0 ? () => setCreating(false) : undefined}
          />
        )}
      </div>
    );
  }

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-text-muted">{t('catalog.subtitle')}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setShowSetup((v) => !v)}>
            {showSetup ? t('catalog.hideSetup') : t('catalog.showSetup')}
          </Button>
          <Button onClick={openCreate} disabled={!activeId}>
            {t('catalog.addProduct')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {collections.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveId(c.id)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
              activeId === c.id
                ? 'bg-brand text-white'
                : 'border border-border bg-surface text-text-muted hover:bg-surface-muted'
            }`}
          >
            <span>{presetIcon(c.icon)}</span>
            {c.name}
            {activeId === c.id && <span className="opacity-70">({total})</span>}
          </button>
        ))}
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          {t('catalog.newCatalog')}
        </Button>
      </div>

      {creating && token && (
        <CatalogPresetPicker
          token={token}
          presets={presets}
          hasCollections
          onCreated={handleCollectionCreated}
          onCancel={() => setCreating(false)}
        />
      )}

      {showSetup && activeCollection && token && (
        <>
          <CatalogFieldsPanel
            token={token}
            collectionId={activeCollection.id}
            fields={fields}
            onChanged={loadEntries}
          />
          <CatalogImportPanel
            token={token}
            collection={activeCollection}
            fields={fields}
            presetKey={presetKey}
            onImported={loadEntries}
          />
        </>
      )}

      {selected.size > 0 && (
        <div className="flex items-center gap-2 rounded-[10px] border border-brand/30 bg-brand-soft px-3 py-2">
          <span className="text-[13px] font-medium text-brand">
            {t('catalog.selected', { count: String(selected.size) })}
          </span>
          <Button variant="secondary" size="sm" onClick={() => setSelected(new Set())}>
            {t('catalog.clearSelection')}
          </Button>
          <Button variant="secondary" size="sm" onClick={bulkDelete} className="text-danger">
            {t('catalog.deleteSelected')}
          </Button>
        </div>
      )}

      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-text-muted">{t('catalog.loading')}</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-[13px] text-text-muted">{t('catalog.noProducts')}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowSetup(true)}>
              {t('catalog.importOrSetup')}
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[13px]">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
                  <th className="w-10 px-3 py-2.5" />
                  <th className="px-4 py-2.5">{t('catalog.colProduct')}</th>
                  {tableColumns.slice(1).map((f) => (
                    <th key={f.id} className="px-4 py-2.5">
                      {f.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5">{t('catalog.colStatus')}</th>
                  <th className="px-4 py-2.5 w-32" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-surface-muted/60">
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleSelect(entry.id)}
                        className="h-4 w-4 rounded border-border-strong text-brand"
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-text">
                      {entryTitle(fields, entry.values)}
                    </td>
                    {tableColumns.slice(1).map((f) => (
                      <td key={f.id} className="px-4 py-3 text-text-muted">
                        {formatEntryValue(f.type, getEntryFieldValue(entry.values, f), f.config)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          entry.status === 'published'
                            ? 'bg-brand-soft text-brand'
                            : 'bg-warning-soft text-warning'
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button variant="secondary" size="sm" onClick={() => openEdit(entry)}>
                          {t('catalog.edit')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-danger"
                          onClick={() => removeEntry(entry.id)}
                        >
                          {t('catalog.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-[13px] text-text-subtle">
            {t('catalog.showing', { from: String(from), to: String(to), total: String(total) })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t('catalog.prev')}
            </Button>
            <span className="text-[13px] text-text-muted">
              {t('catalog.pageOf', { page: String(page), total: String(totalPages) })}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('catalog.next')}
            </Button>
          </div>
        </div>
      </Card>

      {activeCollection && (
        <button
          type="button"
          onClick={deleteCollection}
          className="text-[12px] font-medium text-danger hover:underline"
        >
          {t('catalog.deleteCatalog')}
        </button>
      )}

      <Modal
        open={modalOpen}
        title={editing ? t('catalog.editProduct') : t('catalog.addProduct')}
        onClose={() => setModalOpen(false)}
      >
        <p className="mb-4 text-[12px] text-text-muted">
          {t('catalog.modalHint', { catalog: activeCollection?.name ?? '' })}
        </p>
        <div className="max-h-[50vh] space-y-3 overflow-y-auto pe-1">
          {fields
            .filter((f) => f.visibility !== 'internal')
            .map((f) => (
              <Field key={f.id} label={f.label}>
                <ProductFieldInput
                  field={f}
                  value={draft[f.id]}
                  onChange={(v) => setDraft((d) => ({ ...d, [f.id]: v }))}
                />
              </Field>
            ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalOpen(false)}>
            {t('catalog.cancel')}
          </Button>
          <Button onClick={saveProduct} disabled={saving}>
            {saving ? t('catalog.saving') : t('catalog.save')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
