import { Navigate, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '../contexts/SuperAdminAuthContext';

export function AdminGuestRoute() {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
