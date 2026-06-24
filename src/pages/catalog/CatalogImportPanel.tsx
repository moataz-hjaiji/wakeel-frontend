import { useRef, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { catalogService } from '../../services/catalog.service';
import type { Collection, CollectionField } from '../../types/training';
import { Button, Card } from '../../components/ui/primitives';
import { presetIcon } from './lib/catalog-utils';
import {
  CATALOG_TEMPLATES,
  TemplateDownloadLinks,
  templateDownloadUrl,
} from './TemplateDownloadLinks';
import { IMPORT_ACCEPT, importFileTypeLabel, isAllowedImportFile } from './lib/import-utils';

interface CatalogImportPanelProps {
  token: string;
  collection: Collection;
  fields: CollectionField[];
  presetKey?: string;
  onImported: () => void;
}

export function CatalogImportPanel({
  token,
  collection,
  fields,
  presetKey,
  onImported,
}: CatalogImportPanelProps) {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState('');
  const [importError, setImportError] = useState('');
  const [importing, setImporting] = useState(false);
  const [dragging, setDragging] = useState(false);

  const template =
    CATALOG_TEMPLATES.find((t) => t.key === presetKey) ??
    CATALOG_TEMPLATES.find((t) =>
      t.columns.every((col) => fields.some((f) => f.label.toLowerCase() === col.toLowerCase())),
    );

  async function importFile(file: File) {
    if (!isAllowedImportFile(file)) {
      setImportError(t('catalog.importFileTypeError'));
      return;
    }
    setImporting(true);
    setImportMsg('');
    setImportError('');
    try {
      const res = await catalogService.importEntries(collection.id, token, { file });
      setImportMsg(
        t('catalog.importSuccess', {
          count: String(res.imported),
          type: importFileTypeLabel(file),
        }),
      );
      onImported();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : t('catalog.importFailed'));
    } finally {
      setImporting(false);
    }
  }

  return (
    <Card>
      <h3 className="text-[15px] font-semibold text-text">{t('catalog.importTitle')}</h3>

      <div className="mt-3 rounded-[10px] border border-border bg-surface-muted px-3 py-2.5">
        <p className="text-[12px] font-semibold text-text">
          {presetIcon(collection.icon)} {t('catalog.importingInto', { name: collection.name })}
        </p>
        <p className="mt-1 text-[12px] text-text-muted">
          {t('catalog.importColumns')}{' '}
          <span className="font-medium text-text">
            {fields.map((f) => f.label).join(' · ') || '…'}
          </span>
        </p>
        <p className="mt-1.5 text-[12px] text-text-muted">{t('catalog.vehicleHint')}</p>
      </div>

      <p className="mt-3 text-[13px] text-text-muted">{t('catalog.importDesc')}</p>

      {template && (
        <div className="mt-3 space-y-2">
          <TemplateDownloadLinks template={template} label={collection.name} />
          {presetKey === 'products' && (
            <div className="flex flex-wrap gap-2 border-t border-border pt-2">
              <span className="w-full text-[11px] font-medium text-text-subtle">
                {t('catalog.vehicleFiles')}
              </span>
              <a
                href={templateDownloadUrl('cars-example.xlsx')}
                download="cars-example.xlsx"
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface-muted px-2.5 py-1.5 text-[12px] font-medium text-brand hover:bg-brand-soft"
              >
                ↓ {t('catalog.carsExample')}
              </a>
              <a
                href={templateDownloadUrl('vehicles-bulk-test.xlsx')}
                download="vehicles-bulk-test.xlsx"
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-[12px] font-medium text-brand hover:bg-brand/10"
              >
                ↓ {t('catalog.carsBulk')}
              </a>
            </div>
          )}
        </div>
      )}

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
          if (file) importFile(file);
        }}
        className={`mt-3 flex flex-col items-center justify-center rounded-[10px] border border-dashed px-4 py-8 text-center transition-colors ${
          dragging ? 'border-brand bg-brand-soft' : 'border-border bg-surface-muted'
        }`}
      >
        <p className="text-[13px] font-medium text-text">
          {importing ? t('catalog.importing') : t('catalog.dropFile')}
        </p>
        <p className="mt-1 text-[12px] text-text-muted">{t('catalog.acceptedTypes')}</p>
        <input
          ref={fileRef}
          type="file"
          accept={IMPORT_ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
            if (fileRef.current) fileRef.current.value = '';
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          disabled={importing || fields.length === 0}
          onClick={() => fileRef.current?.click()}
        >
          {t('catalog.chooseFile')}
        </Button>
      </div>

      {importMsg && <p className="mt-2 text-[13px] text-brand">{importMsg}</p>}
      {importError && (
        <div className="mt-3 rounded-[10px] border border-danger/30 bg-danger-soft px-3 py-2.5 text-[13px] text-danger">
          <p className="font-medium">{t('catalog.importFailed')}</p>
          <p className="mt-1">{importError}</p>
        </div>
      )}
    </Card>
  );
}
