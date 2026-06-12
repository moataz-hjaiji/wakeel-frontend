import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { ApiError } from '../../lib/api';
import { adminService } from '../../services/admin.service';
import type { AdminOverview, StoreWithUsage } from '../../types/admin';

function monthRangeISO() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatNumber(n: number) {
  return n.toLocaleString();
}

function formatCost(n: number) {
  return `$${n.toFixed(4)}`;
}

export function AdminDashboardPage() {
  const { token } = useSuperAdminAuth();
  const defaultRange = useMemo(() => monthRangeISO(), []);

  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingStore, setEditingStore] = useState<StoreWithUsage | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [unlimited, setUnlimited] = useState(true);
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [limitError, setLimitError] = useState('');

  const loadOverview = useCallback(async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      const start = new Date(`${startDate}T00:00:00.000Z`).toISOString();
      const end = new Date(`${endDate}T23:59:59.999Z`).toISOString();
      const data = await adminService.getOverview(token, start, end);
      setOverview(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load overview');
    } finally {
      setIsLoading(false);
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function openLimitModal(store: StoreWithUsage) {
    setEditingStore(store);
    setUnlimited(store.monthlyTokenLimit == null);
    setLimitInput(store.monthlyTokenLimit != null ? String(store.monthlyTokenLimit) : '100000');
    setLimitError('');
  }

  function closeLimitModal() {
    setEditingStore(null);
  }

  async function handleSaveLimit() {
    if (!token || !editingStore) return;
    setLimitError('');

    let monthlyTokenLimit: number | null = null;
    if (!unlimited) {
      const parsed = parseInt(limitInput, 10);
      if (!limitInput.trim() || Number.isNaN(parsed) || parsed < 1) {
        setLimitError('Enter a valid token limit (minimum 1)');
        return;
      }
      monthlyTokenLimit = parsed;
    }

    setIsSavingLimit(true);
    try {
      await adminService.updateStoreTokenLimit(token, editingStore.id, monthlyTokenLimit);
      closeLimitModal();
      await loadOverview();
    } catch (err) {
      setLimitError(err instanceof ApiError ? err.message : 'Failed to update limit');
    } finally {
      setIsSavingLimit(false);
    }
  }

  const columns = useMemo<DataTableColumn<StoreWithUsage>[]>(
    () => [
      {
        key: 'name',
        header: 'Store',
        render: (row) => (
          <div>
            <p className="font-medium text-white">{row.name}</p>
            <p className="text-xs text-slate-500">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'usage_limit',
        header: 'Usage / Limit',
        className: 'min-w-[160px]',
        render: (row) => <UsageLimitCell row={row} />,
      },
      {
        key: 'status',
        header: 'Status',
        render: (row) =>
          row.limitStatus.limit == null ? (
            <span className="text-slate-500">Unlimited</span>
          ) : row.limitStatus.allowed ? (
            <span className="text-emerald-400">Active</span>
          ) : (
            <span className="font-medium text-red-400">Limit reached</span>
          ),
      },
      {
        key: 'total_tokens',
        header: 'Total tokens',
        className: 'whitespace-nowrap',
        render: (row) => formatNumber(row.usage.total_tokens),
      },
      {
        key: 'cost',
        header: 'Est. cost',
        className: 'whitespace-nowrap font-medium text-emerald-400',
        render: (row) => formatCost(row.usage.total_cost),
      },
      {
        key: 'createdAt',
        header: 'Joined',
        className: 'whitespace-nowrap text-slate-500',
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
    ],
    [],
  );

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stores &amp; Token Usage</h1>
          <p className="mt-1 text-sm text-slate-400">
            Set monthly token limits — chatbot stops responding when a store hits its cap
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
            />
          </div>
          <button
            type="button"
            onClick={loadOverview}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Apply
          </button>
        </div>
      </div>

      {overview && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Stores" value={String(overview.storeCount)} />
          <StatCard label="Total tokens" value={formatNumber(overview.totals.total_tokens)} />
          <StatCard
            label="At limit"
            value={String(overview.stores.filter((s) => !s.limitStatus.allowed).length)}
            warn={
              overview.stores.some((s) => !s.limitStatus.allowed) ? true : undefined
            }
          />
          <StatCard
            label="Est. platform cost"
            value={formatCost(overview.totals.total_cost)}
            highlight
          />
        </div>
      )}

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={loadOverview}
            className="mt-3 text-sm font-medium text-red-300 underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="admin-table-dark">
          <DataTable
            data={overview?.stores ?? []}
            columns={columns}
            keyExtractor={(row) => row.id}
            pageSize={10}
            isLoading={isLoading}
            emptyMessage="No stores registered yet."
            actions={(row) => (
              <button
                type="button"
                onClick={() => openLimitModal(row)}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800"
              >
                Set limit
              </button>
            )}
          />
        </div>
      )}

      <Modal open={!!editingStore} title="Monthly token limit" onClose={closeLimitModal}>
        {editingStore && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Store: <strong>{editingStore.name}</strong>
            </p>
            <p className="text-sm text-slate-500">
              Used this month: {formatNumber(editingStore.limitStatus.used)} tokens
            </p>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Unlimited (no cap)
            </label>

            {!unlimited && (
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Max tokens per month
                </label>
                <input
                  type="number"
                  min={1}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  placeholder="100000"
                />
              </div>
            )}

            {limitError && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{limitError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeLimitModal}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingLimit}
                onClick={handleSaveLimit}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
              >
                {isSavingLimit ? 'Saving…' : 'Save limit'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function UsageLimitCell({ row }: { row: StoreWithUsage }) {
  const { used, limit } = row.limitStatus;

  if (limit == null) {
    return (
      <div>
        <p className="text-sm text-slate-300">{formatNumber(used)}</p>
        <p className="text-xs text-slate-500">No limit</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div>
      <p className="text-sm text-slate-300">
        {formatNumber(used)} / {formatNumber(limit)}
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-violet-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          warn ? 'text-red-400' : highlight ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </p>
    </div>
  );
}
