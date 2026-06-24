import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useI18n } from '../../contexts/I18nContext';

const titleKeys: Record<string, string> = {
  '/dashboard': 'nav.overview',
  '/dashboard/conversations': 'nav.conversations',
  '/dashboard/training': 'nav.training',
  '/dashboard/whatsapp': 'nav.whatsapp',
};

export function DashboardLayout() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const titleKey = titleKeys[pathname];

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-surface px-6">
          <h1 className="text-sm font-semibold text-text">
            {titleKey ? t(titleKey) : 'Dashboard'}
          </h1>
          <LanguageSwitcher />
        </header>
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-[1120px] px-6 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
