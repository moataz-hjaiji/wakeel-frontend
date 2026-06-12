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
      <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {selectable && selectedIds.size > 0 && (
        <div className="flex items-center justify-between border-b border-indigo-100 bg-indigo-50 px-6 py-3">
          <p className="text-sm font-medium text-indigo-900">
            {selectedIds.size} selected
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Clear
            </button>
            {onBulkDelete && (
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {isBulkDeleting ? 'Deleting…' : bulkDeleteLabel}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = somePageSelected && !allPageSelected;
                    }}
                    onChange={togglePage}
                    aria-label="Select all on this page"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-3 font-medium text-slate-600 ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right font-medium text-slate-600">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row) => {
              const id = keyExtractor(row);
              const isSelected = selectedIds.has(id);

              return (
                <tr
                  key={id}
                  className={isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'}
                >
                  {selectable && (
                    <td className="w-12 px-4 py-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(id)}
                        aria-label="Select row"
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-slate-700 ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : null}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 text-right">{actions(row)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          Showing {from}–{to} of {data.length}
          {selectable && selectedIds.size > 0 && (
            <span className="ml-2 text-indigo-600">· {selectedIds.size} selected total</span>
          )}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
