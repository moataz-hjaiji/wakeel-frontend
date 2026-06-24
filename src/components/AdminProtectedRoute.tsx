import { Navigate, Outlet } from 'react-router-dom';
import { useSuperAdminAuth } from '../contexts/SuperAdminAuthContext';

export function AdminProtectedRoute() {
  const { isAuthenticated, isLoading } = useSuperAdminAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
