import { useEffect, useMemo, useState, type ReactNode } from 'react';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  isLoading?: boolean;
  emptyMessage?: string;
  actions?: (row: T) => ReactNode;
  /** Enable row checkboxes + bulk delete toolbar */
  selectable?: boolean;
  onBulkDelete?: (ids: string[]) => void | Promise<void>;
  isBulkDeleting?: boolean;
  bulkDeleteLabel?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  pageSize = 10,
  isLoading = false,
  emptyMessage = 'No data found.',
  actions,
  selectable = false,
  onBulkDelete,
  isBulkDeleting = false,
  bulkDeleteLabel = 'Delete selected',
}: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Drop selections for rows that no longer exist
  useEffect(() => {
    const validIds = new Set(data.map(keyExtractor));
    setSelectedIds((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [data, keyExtractor]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, page, pageSize]);

  const pageIds = useMemo(
    () => paginatedData.map(keyExtractor),
    [paginatedData, keyExtractor],
  );

  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const somePageSelected = pageIds.some((id) => selectedIds.has(id));

  const from = data.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, data.length);

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (!onBulkDelete || selectedIds.size === 0) return;
    const ids = [...selectedIds];
    await onBulkDelete(ids);
    clearSelection();
  }

  if (isLoading) {
    return (
      <div className="rounded-[14px] border border-border bg-surface p-3 shadow-[var(--shadow-sm)]">
        <div className="h-6 animate-pulse rounded bg-surface-muted" />
        <div className="mt-2 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 animate-pulse rounded bg-surface-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-[14px] border border-dashed border-border bg-surface p-10 text-center text-[13px] text-text-subtle">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-surface shadow-[var(--shadow-sm)]">
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-border bg-brand-soft px-4 py-2">
          <p className="text-[13px] font-medium text-brand">
            {selectedIds.size} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-md border border-border bg-surface px-2.5 py-1 text-[13px] font-medium text-text-muted hover:bg-surface-muted"
            >
              Clear
            </button>
            {onBulkDelete && (
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="rounded-md border border-danger/30 bg-surface px-2.5 py-1 text-[13px] font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
              >
                {isBulkDeleting ? 'Deleting…' : bulkDeleteLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-start text-[13px]">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              {selectable && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={togglePage}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-2 font-medium text-text-muted ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-2 text-end font-medium text-text-muted">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {paginatedData.map((row) => {
              const id = keyExtractor(row);
              const isSelected = selectedIds.has(id);

              return (
                <tr
                  key={id}
                  className={isSelected ? 'bg-brand-soft/50' : 'hover:bg-surface-muted'}
                >
                  {selectable && (
                    <td className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                        aria-label="Select row"
                        className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 text-text ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : null}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-2.5 text-end">{actions(row)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] text-text-subtle">
          Showing {from}–{to} of {data.length}
          {selectable && selectedIds.size > 0 && (
            <span className="ms-2 text-brand">· {selectedIds.size} selected total</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-[13px] text-text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-border px-2.5 py-1 text-[13px] font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
