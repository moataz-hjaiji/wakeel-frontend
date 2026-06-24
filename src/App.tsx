import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { I18nProvider } from './contexts/I18nContext';
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
import { TrainingPage } from './pages/training/TrainingPage';
import { ConversationsPage } from './pages/conversations/ConversationsPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { WhatsappPage } from './pages/WhatsappPage';
import { LandingPage } from './pages/LandingPage';

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <SuperAdminAuthProvider>
          <BrowserRouter>
          <Routes>
            {/* Landing — path-based locales for SEO. "/" is English (default);
                "/fr", "/ar", "/en" are crawlable alternates of the same page. */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/en" element={<LandingPage />} />
            <Route path="/fr" element={<LandingPage />} />
            <Route path="/ar" element={<LandingPage />} />

            <Route element={<GuestRoute />}>
              <Route path="/auth" element={<AuthPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/conversations" element={<ConversationsPage />} />
                <Route path="/dashboard/training" element={<TrainingPage />} />
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
    </I18nProvider>
  );
}
