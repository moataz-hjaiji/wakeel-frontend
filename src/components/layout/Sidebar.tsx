import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';

const navItems = [
  { to: '/dashboard', key: 'nav.overview', end: true },
  { to: '/dashboard/conversations', key: 'nav.conversations', end: false },
  { to: '/dashboard/training', key: 'nav.training', end: false },
  { to: '/dashboard/catalog', key: 'nav.catalog', end: false },
  { to: '/dashboard/whatsapp', key: 'nav.whatsapp', end: false },
];

export function Sidebar() {
  const { store, logout } = useAuth();
  const { t } = useI18n();

  const initial = store?.name?.trim()?.[0]?.toUpperCase() ?? 'W';

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-e border-border bg-surface">
      {/* Brand + tenant */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-brand text-xs font-bold text-white">
            و
          </span>
          <span className="font-display text-base font-bold text-text">Wakeel</span>
        </div>

        <div className="mt-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[13px] font-semibold text-brand">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-text">{store?.name}</p>
            <p className="truncate text-xs text-text-subtle">{store?.email}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-2.5 py-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `relative block rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-soft font-medium text-brand'
                  : 'text-text-muted hover:bg-surface-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-brand" />
                )}
                {t(item.key)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-2.5">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-md px-2.5 py-1.5 text-start text-[13px] text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
        >
          {t('nav.signOut')}
        </button>
      </div>
    </aside>
  );
}
