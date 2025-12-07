import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { useAppContext } from './context/AppContext';
import { Role } from './types';

// Layout and Auth
import MainLayout from './components/layout/MainLayout';
import StudentAuthPage from './components/auth/StudentAuthPage';

// Student Components
import StudentDashboard from './components/student/StudentDashboard';
import BookTokenPage from './components/student/BookTokenPage';
import TokenHistoryPage from './components/student/TokenHistoryPage';

// Staff Components
import StaffDashboard from './components/staff/StaffDashboard';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import OfficeManagementPage from './components/admin/OfficeManagementPage';
import UserManagementPage from './components/admin/UserManagementPage';

const App: React.FC = () => {
  const { currentUser, loading, session, error } = useAppContext();

  // Render a full-page loading indicator while the initial session and data are being fetched.
  // This is a crucial fix to prevent race conditions and ensure all necessary data is loaded
  // before any components attempt to render.
  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-neutral-100">
            <div className="w-16 h-16 border-8 border-dashed rounded-full animate-spin border-primary-dark" role="status" aria-label="Loading application"></div>
        </div>
    );
  }

  // Global error boundary for startup failures (e.g., loading timeout, RLS issues)
  if (error && !currentUser) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-900 p-4">
            <div className="text-center max-w-xl bg-white p-8 rounded-lg shadow-lg border border-red-200">
                <h1 className="text-3xl font-bold text-red-700 mb-4">Application Error</h1>
                <p className="text-neutral-700 mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                >
                    Refresh Page
                </button>
            </div>
        </div>
    );
  }

  if (!session || !currentUser) {
    return <StudentAuthPage />;
  }

  const renderRoutes = () => {
    switch (currentUser.role) {
      case Role.STUDENT:
        return (
          <Routes>
            <Route path="/dashboard" element={<StudentDashboard />} />
            <Route path="/book-token" element={<BookTokenPage />} />
            <Route path="/history" element={<TokenHistoryPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      case Role.STAFF:
        return (
          <Routes>
            <Route path="/dashboard" element={<StaffDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      case Role.ADMIN:
        return (
          <Routes>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/offices" element={<OfficeManagementPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/staff-view" element={<StaffDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        );
      default:
        // This case should ideally not be hit if loading is handled correctly, but serves as a fallback.
        return (
          <div className="flex items-center justify-center h-full">
            <p>Verifying user role...</p>
          </div>
        );
    }
  };

  return (
    <HashRouter>
      <MainLayout>
        {renderRoutes()}
      </MainLayout>
    </HashRouter>
  );
};

export default App;
