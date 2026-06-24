import {
  CATALOG_TEMPLATES,
  templateDownloadUrl,
  templateForPreset,
  type CatalogTemplate,
} from './lib/catalog-templates';

export function TemplateDownloadLinks({
  template,
  label,
}: {
  template: CatalogTemplate;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={templateDownloadUrl(template.filename)}
        download={template.filename}
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface-muted px-2.5 py-1.5 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft"
      >
        ↓ {label ? `${label} ` : ''}Excel (.xlsx)
      </a>
      <a
        href={templateDownloadUrl(template.csvFilename)}
        download={template.csvFilename}
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-border bg-surface-muted px-2.5 py-1.5 text-[12px] font-medium text-brand transition-colors hover:bg-brand-soft"
      >
        ↓ {label ? `${label} ` : ''}CSV (.csv)
      </a>
      {template.bulkTestFilename && (
        <a
          href={templateDownloadUrl(template.bulkTestFilename)}
          download={template.bulkTestFilename}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-[12px] font-medium text-brand transition-colors hover:bg-brand/10"
        >
          ↓ Bulk test (12 items)
        </a>
      )}
    </div>
  );
}

export { CATALOG_TEMPLATES, templateDownloadUrl, templateForPreset };
