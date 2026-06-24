import { useEffect, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { catalogService } from '../../services/catalog.service';
import type { CollectionField, FieldType } from '../../types/training';
import { Button, Card, Input, Select } from '../../components/ui/primitives';

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

interface CatalogFieldsPanelProps {
  token: string;
  collectionId: string;
  fields: CollectionField[];
  onChanged: () => void;
}

export function CatalogFieldsPanel({
  token,
  collectionId,
  fields,
  onChanged,
}: CatalogFieldsPanelProps) {
  const { t } = useI18n();
  const [advanced, setAdvanced] = useState(false);
  const [localFields, setLocalFields] = useState(fields);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

  async function addField() {
    await catalogService.createField(
      collectionId,
      { label: 'New field', type: 'text', visibility: 'agent_visible', quoteMode: 'paraphrase' },
      token,
    );
    onChanged();
  }

  async function patchField(id: string, body: Partial<CollectionField>) {
    await catalogService.updateField(collectionId, id, body, token);
    onChanged();
  }

  async function deleteField(id: string) {
    if (!window.confirm(t('catalog.confirmDeleteField'))) return;
    await catalogService.deleteField(collectionId, id, token);
    onChanged();
  }

  const displayFields = localFields;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-text">{t('catalog.columnsTitle')}</h3>
          <p className="mt-0.5 text-[13px] text-text-muted">{t('catalog.columnsHint')}</p>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 text-[12px] text-text-muted">
          <input
            type="checkbox"
            checked={advanced}
            onChange={(e) => setAdvanced(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-border-strong text-brand"
          />
          {t('catalog.moreOptions')}
        </label>
      </div>

      <div className="mt-3 overflow-x-auto rounded-[10px] border border-border">
        <table className="w-full min-w-[480px] text-[13px]">
          <thead>
            <tr className="border-b border-border bg-surface-muted text-left text-[11px] font-semibold uppercase tracking-wide text-text-subtle">
              <th className="px-3 py-2">{t('catalog.colName')}</th>
              {advanced && <th className="px-3 py-2">{t('catalog.colType')}</th>}
              {advanced && <th className="px-3 py-2">{t('catalog.colAgent')}</th>}
              {advanced && <th className="px-3 py-2">{t('catalog.colQuotes')}</th>}
              <th className="px-3 py-2 w-12" />
            </tr>
          </thead>
          <tbody>
            {displayFields.map((f) => (
              <tr key={f.id} className="border-b border-border last:border-0">
                <td className="px-3 py-2">
                  <Input
                    value={f.label}
                    onChange={(e) =>
                      setLocalFields((fs) =>
                        fs.map((x) => (x.id === f.id ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    onBlur={(e) => patchField(f.id, { label: e.target.value })}
                    className="w-full min-w-[140px]"
                  />
                </td>
                {advanced && (
                  <td className="px-3 py-2">
                    <Select
                      value={f.type}
                      onChange={(e) => patchField(f.id, { type: e.target.value as FieldType })}
                      className="w-full min-w-[120px]"
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                )}
                {advanced && (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        patchField(f.id, {
                          visibility: f.visibility === 'internal' ? 'agent_visible' : 'internal',
                        })
                      }
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        f.visibility === 'internal'
                          ? 'bg-surface-muted text-text-subtle'
                          : 'bg-brand-soft text-brand'
                      }`}
                    >
                      {f.visibility === 'internal' ? t('catalog.hidden') : t('catalog.visible')}
                    </button>
                  </td>
                )}
                {advanced && (
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() =>
                        patchField(f.id, {
                          quoteMode: f.quoteMode === 'exact' ? 'paraphrase' : 'exact',
                        })
                      }
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        f.quoteMode === 'exact'
                          ? 'bg-warning-soft text-warning'
                          : 'bg-surface-muted text-text-subtle'
                      }`}
                    >
                      {f.quoteMode === 'exact' ? t('catalog.exact') : t('catalog.reword')}
                    </button>
                  </td>
                )}
                <td className="px-3 py-2 text-end">
                  <button
                    type="button"
                    onClick={() => deleteField(f.id)}
                    className="text-[12px] font-medium text-danger hover:underline"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="secondary" size="sm" className="mt-3" onClick={addField}>
        {t('catalog.addColumn')}
      </Button>
    </Card>
  );
}
