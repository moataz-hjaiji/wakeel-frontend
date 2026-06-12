import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SuperAdminAuthProvider } from './contexts/SuperAdminAuthContext';
import { GuestRoute } from './components/GuestRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminGuestRoute } from './components/AdminGuestRoute';
import { AdminProtectedRoute } from './components/AdminProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CatalogPage } from './pages/CatalogPage';
import { FaqsPage } from './pages/FaqsPage';
import { ChatPage } from './pages/ChatPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { WhatsappPage } from './pages/WhatsappPage';

export default function App() {
  return (
    <AuthProvider>
      <SuperAdminAuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/auth" replace />} />

            <Route element={<GuestRoute />}>
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/chat" element={<ChatPage />} />
                <Route path="/dashboard/catalog" element={<CatalogPage />} />
                <Route path="/dashboard/products" element={<CatalogPage />} />
                <Route path="/dashboard/faqs" element={<FaqsPage />} />
                <Route path="/dashboard/whatsapp" element={<WhatsappPage />} />
              </Route>
            </Route>

            <Route element={<AdminGuestRoute />}>
              <Route path="/admin/login" element={<AdminLoginPage />} />
            </Route>

            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/auth" replace />} />
          </Routes>
        </BrowserRouter>
      </SuperAdminAuthProvider>
    </AuthProvider>
  );
}
