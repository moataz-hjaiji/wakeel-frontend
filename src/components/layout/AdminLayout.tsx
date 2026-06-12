import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';

export function AdminLayout() {
  const { admin, logout } = useSuperAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Super Admin
          </p>
          <h1 className="mt-1 text-lg font-bold text-white">Platform Console</h1>
        </div>
        <nav className="flex-1 px-4 py-4">
          <Link
            to="/admin/dashboard"
            className="block rounded-lg bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-300"
          >
            Stores &amp; Token Usage
          </Link>
        </nav>
        <div className="border-t border-slate-800 px-4 py-4">
          <p className="truncate text-sm font-medium text-slate-200">{admin?.name}</p>
          <p className="truncate text-xs text-slate-500">{admin?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
