import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/common/Navbar.tsx';
import { BottomNavigationBar } from './components/navigation/BottomNavigationBar.tsx';
import { PageLoadingFallback } from './components/common/PageLoadingFallback.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { mockAuthService } from './services/mock/mockAuthService.ts';

// Route-based code-splitting for modern PWA performance
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage }))
);
const FindingsManagementPage = lazy(() =>
  import('./pages/findings/FindingsManagementPage.tsx').then((m) => ({
    default: m.FindingsManagementPage,
  }))
);
const FindingDetailPage = lazy(() =>
  import('./pages/findings/FindingDetailPage.tsx').then((m) => ({
    default: m.FindingDetailPage,
  }))
);
const CreateFindingPage = lazy(() =>
  import('./pages/findings/CreateFindingPage.tsx').then((m) => ({
    default: m.CreateFindingPage,
  }))
);
const EditFindingPage = lazy(() =>
  import('./pages/findings/EditFindingPage.tsx').then((m) => ({
    default: m.EditFindingPage,
  }))
);
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage.tsx').then((m) => ({ default: m.ProfilePage }))
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage.tsx').then((m) => ({ default: m.AboutPage }))
);

/**
 * Root redirect: navigates to /dashboard if logged in, or /login if not.
 */
const RootRedirect: React.FC = () => {
  const isAuth = mockAuthService.isAuthenticated();
  return <Navigate to={isAuth ? '/dashboard' : '/login'} replace />;
};

/**
 * Authenticated Layout: displays Top Navbar, Main Content, and Fixed Bottom Navigation Bar
 */
const AuthenticatedLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-red-500 selection:text-white">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <Suspense fallback={<PageLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomNavigationBar />
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Login Route */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected App Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AuthenticatedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/findings" element={<FindingsManagementPage />} />
          <Route path="/findings/new" element={<CreateFindingPage />} />
          <Route path="/findings/:id" element={<FindingDetailPage />} />
          <Route path="/findings/:id/edit" element={<EditFindingPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
