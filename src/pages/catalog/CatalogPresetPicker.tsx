import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { catalogService } from '../../services/catalog.service';
import type { CollectionPreset } from '../../types/training';
import { Button, Card } from '../../components/ui/primitives';
import { presetIcon } from './lib/catalog-utils';
import { TemplateDownloadLinks, templateForPreset } from './TemplateDownloadLinks';

interface CatalogPresetPickerProps {
  token: string;
  presets: CollectionPreset[];
  hasCollections: boolean;
  onCreated: (id: string) => void;
  onCancel?: () => void;
}

export function CatalogPresetPicker({
  token,
  presets,
  hasCollections,
  onCreated,
  onCancel,
}: CatalogPresetPickerProps) {
  const { t } = useI18n();
  const [creating, setCreating] = useState(false);

  async function createCollection(preset: CollectionPreset) {
    setCreating(true);
    try {
      const col = await catalogService.createCollection(
        { name: preset.name, icon: preset.icon, preset: preset.key },
        token,
      );
      onCreated(col.id);
    } finally {
      setCreating(false);
    }
  }

  return (
    <Card>
      <h3 className="text-[15px] font-semibold text-text">{t('catalog.presetTitle')}</h3>
      <p className="mt-0.5 text-[13px] text-text-muted">{t('catalog.presetHint')}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {presets.map((p) => {
          const template = templateForPreset(p.key);
          return (
            <div
              key={p.key}
              className="flex flex-col rounded-[12px] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]"
            >
              <button
                type="button"
                disabled={creating}
                onClick={() => createCollection(p)}
                className="flex items-start gap-3 text-start transition-colors hover:opacity-90 disabled:opacity-60"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-soft text-xl">
                  {presetIcon(p.icon)}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-text">{p.name}</span>
                  {p.key === 'products' && (
                    <span className="mt-0.5 block text-[11px] text-brand">
                      {t('catalog.productsHint')}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[12px] text-text-muted">
                    {p.fields.map((f) => f.label).join(' · ')}
                  </span>
                </span>
              </button>
              {template && (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <TemplateDownloadLinks template={template} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {hasCollections && onCancel && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onCancel}>
          {t('catalog.cancel')}
        </Button>
      )}
    </Card>
  );
}

export function useCatalogPresets(token: string | null) {
  const [presets, setPresets] = useState<CollectionPreset[]>([]);
  useEffect(() => {
    if (!token) return;
    catalogService.presets(token).then(setPresets);
  }, [token]);
  return presets;
}
