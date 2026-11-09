import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { PageLoadingFallback } from './components/common/PageLoadingFallback';
import { WelcomePage } from './pages/WelcomePage';
import { LoginPage } from './pages/LoginPage';
import { RegistrationPendingPage } from './pages/RegistrationPendingPage';
import { RegistrationSuccessPage } from './pages/RegistrationSuccessPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';

// Route-based code-splitting for high-overhead application modules
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const AdminPortalPage = lazy(() =>
  import('./pages/admin/AdminPortalPage').then((m) => ({ default: m.AdminPortalPage }))
);
const MasterDataPage = lazy(() =>
  import('./pages/admin/MasterDataPage').then((m) => ({ default: m.MasterDataPage }))
);
const PatrolsListPage = lazy(() =>
  import('./pages/patrols/PatrolsListPage').then((m) => ({ default: m.PatrolsListPage }))
);
const PatrolDetailPage = lazy(() =>
  import('./pages/patrols/PatrolDetailPage').then((m) => ({ default: m.PatrolDetailPage }))
);
const FindingsManagementPage = lazy(() =>
  import('./pages/findings/FindingsManagementPage').then((m) => ({ default: m.FindingsManagementPage }))
);
const FindingDetailPage = lazy(() =>
  import('./pages/findings/FindingDetailPage').then((m) => ({ default: m.FindingDetailPage }))
);
const MyFindingsPage = lazy(() =>
  import('./pages/findings/MyFindingsPage').then((m) => ({ default: m.MyFindingsPage }))
);

export function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-slate-50 text-gray-900">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<WelcomePage />} />
              <Route path="/welcome" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/registration-pending" element={<RegistrationPendingPage />} />
              <Route path="/registration-success" element={<RegistrationSuccessPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              {/* Module 05: Safety Patrol Management */}
              <Route
                path="/patrols"
                element={
                  <ProtectedRoute>
                    <PatrolsListPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/patrols/:id"
                element={
                  <ProtectedRoute>
                    <PatrolDetailPage />
                  </ProtectedRoute>
                }
              />
              {/* Module 05: Safety Findings Management */}
              <Route
                path="/findings"
                element={
                  <ProtectedRoute>
                    <FindingsManagementPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/findings/:id"
                element={
                  <ProtectedRoute>
                    <FindingDetailPage />
                  </ProtectedRoute>
                }
              />
              {/* Module 05: Personal Findings for Members */}
              <Route
                path="/my-findings"
                element={
                  <ProtectedRoute>
                    <MyFindingsPage />
                  </ProtectedRoute>
                }
              />
              {/* Module 03: QSHE Admin Master Data Management */}
              <Route
                path="/admin/master-data"
                element={
                  <AdminRoute>
                    <MasterDataPage />
                  </AdminRoute>
                }
              />
              {/* Module 02: QSHE Admin User & Access Management */}
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminPortalPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminPortalPage />
                  </AdminRoute>
                }
              />
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
