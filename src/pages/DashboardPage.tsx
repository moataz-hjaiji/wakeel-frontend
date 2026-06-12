import { useAuth } from '../contexts/AuthContext';

export function DashboardPage() {
  const { store } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900">Overview</h1>
      <p className="mt-1 text-sm text-slate-500">Welcome back, {store?.name}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Store ID</p>
          <p className="mt-2 break-all font-mono text-sm text-slate-800">{store?.id}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Webhook secret
          </p>
          <p className="mt-2 break-all font-mono text-sm text-slate-800">
            {store?.webhookSecret}
          </p>
        </div>
      </div>
    </div>
  );
}
