import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';
import { DataTable, type DataTableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  StatTile,
} from '../../components/ui/primitives';
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
            <p className="font-medium text-text">{row.name}</p>
            <p className="text-xs text-text-subtle">{row.email}</p>
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
            <Badge tone="neutral">Unlimited</Badge>
          ) : row.limitStatus.allowed ? (
            <Badge tone="brand">Active</Badge>
          ) : (
            <Badge tone="danger">Limit reached</Badge>
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
        className: 'whitespace-nowrap font-medium text-text',
        render: (row) => formatCost(row.usage.total_cost),
      },
      {
        key: 'createdAt',
        header: 'Joined',
        className: 'whitespace-nowrap text-text-subtle',
        render: (row) => new Date(row.createdAt).toLocaleDateString(),
      },
    ],
    [],
  );

  return (
    <div>
      <PageHeader
        title="Stores & usage"
        subtitle="Set monthly token limits — the agent pauses when a store hits its cap."
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <Field label="From" htmlFor="from">
              <Input
                id="from"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
            </Field>
            <Field label="To" htmlFor="to">
              <Input
                id="to"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </Field>
            <Button variant="secondary" onClick={loadOverview}>
              Apply
            </Button>
          </div>
        }
      />

      {overview && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Stores" value={String(overview.storeCount)} />
          <StatTile label="Total tokens" value={formatNumber(overview.totals.total_tokens)} />
          <StatTile
            label="At limit"
            value={String(overview.stores.filter((s) => !s.limitStatus.allowed).length)}
          />
          <StatTile
            label="Est. platform cost"
            value={formatCost(overview.totals.total_cost)}
          />
        </div>
      )}

      {error ? (
        <div className="rounded-[14px] border border-danger/30 bg-danger-soft p-6 text-center">
          <p className="text-[13px] text-danger">{error}</p>
          <button
            type="button"
            onClick={loadOverview}
            className="mt-2 text-[13px] font-medium text-danger underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <DataTable
          data={overview?.stores ?? []}
          columns={columns}
          keyExtractor={(row) => row.id}
          pageSize={10}
          isLoading={isLoading}
          emptyMessage="No stores registered yet."
          actions={(row) => (
            <Button variant="secondary" size="sm" onClick={() => openLimitModal(row)}>
              Set limit
            </Button>
          )}
        />
      )}

      <Modal open={!!editingStore} title="Monthly token limit" onClose={closeLimitModal}>
        {editingStore && (
          <div className="space-y-4">
            <p className="text-[13px] text-text-muted">
              Store: <strong className="text-text">{editingStore.name}</strong>
            </p>
            <p className="text-[13px] text-text-subtle">
              Used this month: {formatNumber(editingStore.limitStatus.used)} tokens
            </p>

            <label className="flex items-center gap-2 text-[13px] text-text">
              <input
                type="checkbox"
                checked={unlimited}
                onChange={(e) => setUnlimited(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
              />
              Unlimited (no cap)
            </label>

            {!unlimited && (
              <Field label="Max tokens per month">
                <Input
                  type="number"
                  min={1}
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="100000"
                />
              </Field>
            )}

            {limitError && (
              <p className="rounded-[10px] bg-danger-soft px-3 py-2 text-[13px] text-danger">
                {limitError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={closeLimitModal}>
                Cancel
              </Button>
              <Button disabled={isSavingLimit} onClick={handleSaveLimit}>
                {isSavingLimit ? 'Saving…' : 'Save limit'}
              </Button>
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
        <p className="text-[13px] text-text">{formatNumber(used)}</p>
        <p className="text-xs text-text-subtle">No limit</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((used / limit) * 100));

  return (
    <div>
      <p className="text-[13px] text-text">
        {formatNumber(used)} / {formatNumber(limit)}
      </p>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full rounded-full ${pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
