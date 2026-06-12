import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Overview', end: true },
  { to: '/dashboard/chat', label: 'Test Chat', end: false },
  { to: '/dashboard/catalog', label: 'Catalog', end: false },
  { to: '/dashboard/faqs', label: 'Q&A', end: false },
  { to: '/dashboard/whatsapp', label: 'WhatsApp', end: false },
];

export function Sidebar() {
  const { store, logout } = useAuth();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-lg font-bold text-indigo-600">ChatBot</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-900">{store?.name}</p>
        <p className="truncate text-xs text-slate-500">{store?.email}</p>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
