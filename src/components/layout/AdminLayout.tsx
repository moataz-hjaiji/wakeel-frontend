import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSuperAdminAuth } from '../../contexts/SuperAdminAuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

export function AdminLayout() {
  const { admin, logout } = useSuperAdminAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex h-screen w-56 shrink-0 flex-col border-e border-border bg-surface">
        <div className="px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
              و
            </span>
            <span className="font-display text-base font-bold text-text">Wakeel</span>
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
              Admin
            </span>
          </div>
        </div>
        <nav className="flex-1 px-2.5 py-1">
          <Link
            to="/admin/dashboard"
            className="relative block rounded-md bg-brand-soft px-2.5 py-1.5 text-[13px] font-medium text-brand"
          >
            <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-brand" />
            {t('nav.stores')}
          </Link>
        </nav>
        <div className="border-t border-border p-2.5">
          <p className="truncate px-2.5 text-[13px] font-medium text-text">{admin?.name}</p>
          <p className="truncate px-2.5 text-xs text-text-subtle">{admin?.email}</p>
          <div className="mt-2 px-2.5">
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 w-full rounded-md px-2.5 py-1.5 text-start text-[13px] text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-[1120px] px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
