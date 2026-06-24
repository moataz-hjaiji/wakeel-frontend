import type { CollectionField } from '../../types/training';
import { Field, Input } from '../../components/ui/primitives';

export function ProductFieldInput({
  field,
  value,
  onChange,
}: {
  field: CollectionField;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  if (field.type === 'toggle') {
    return (
      <label className="flex h-9 items-center gap-2 text-[13px]">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-border-strong text-brand"
        />
        {value === true ? 'Yes' : 'No'}
      </label>
    );
  }
  if (field.type === 'long_text') {
    return (
      <textarea
        rows={2}
        dir="auto"
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]"
      />
    );
  }
  if (field.type === 'number' || field.type === 'price') {
    return (
      <Input
        type="number"
        value={(value as number | string) ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
    );
  }
  return (
    <Input
      dir="auto"
      value={(value as string) ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function ProductFieldsForm({
  fields,
  draft,
  onChange,
}: {
  fields: CollectionField[];
  draft: Record<string, unknown>;
  onChange: (draft: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields
        .filter((f) => f.visibility !== 'internal')
        .map((f) => (
          <Field key={f.id} label={f.label}>
            <ProductFieldInput
              field={f}
              value={draft[f.id]}
              onChange={(v) => onChange({ ...draft, [f.id]: v })}
            />
          </Field>
        ))}
    </div>
  );
}
