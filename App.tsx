import React, { useEffect } from 'react';
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
  const { currentUser, loading, session, error, refreshTokens } = useAppContext();

  /* ------------------------------------------------------------------
     GLOBAL PULL-TO-REFRESH (ANIMATED)
  ------------------------------------------------------------------ */
  useEffect(() => {
    let startY = 0;
    let pulling = false;
    const threshold = 80;
    const indicator = document.getElementById("ptr-indicator");

    const onStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        pulling = true;
        startY = e.touches[0].clientY;
      }
    };

    const onMove = (e: TouchEvent) => {
      if (!pulling || !indicator) return;

      const diff = e.touches[0].clientY - startY;

      // Stretch animation while pulling
      if (diff > 0 && diff < threshold) {
        indicator.style.opacity = "1";
        indicator.style.transform = `translateY(${diff / 2}px)`;
      }

      // Trigger refresh when threshold crossed
      if (diff > threshold) {
        pulling = false;
        indicator.style.transform = "translateY(60px)";
        indicator.style.opacity = "1";

        refreshTokens().then(() => {
          setTimeout(() => {
            indicator.style.opacity = "0";
            indicator.style.transform = "translateY(0px)";
          }, 500);
        });
      }
    };

    const onEnd = () => {
      pulling = false;
      if (indicator) {
        indicator.style.opacity = "0";
        indicator.style.transform = "translateY(0px)";
      }
    };

    document.addEventListener("touchstart", onStart);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, [refreshTokens]);

  /* ------------------------------------------------------------------
     INITIAL LOADING & AUTH HANDLING — UNTOUCHED
  ------------------------------------------------------------------ */

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 overflow-hidden w-full">
        {/* Sidebar Skeleton */}
        <div className="hidden lg:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-6">
          <div className="h-10 w-32 bg-slate-200 rounded-lg animate-pulse mb-8" />
          <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-12 w-full bg-slate-200 rounded-lg animate-pulse" />
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col p-6 lg:p-10 gap-8">
          <div className="h-12 w-48 bg-slate-200 rounded-lg animate-pulse hidden lg:block" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="h-24 md:h-32 bg-slate-200 rounded-2xl animate-pulse" />
             <div className="h-24 md:h-32 bg-slate-200 rounded-2xl animate-pulse" />
             <div className="h-24 md:h-32 bg-slate-200 rounded-2xl animate-pulse" />
          </div>
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-6">
             <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-6" />
             <div className="space-y-4">
               <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
               <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
               <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 text-red-900 p-4">
        <div className="text-center max-w-xl bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <h1 className="text-3xl font-bold text-red-700 mb-4">
            Application Error
          </h1>
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
    return (
      <>
        {/* Pull-to-Refresh Indicator */}
        <div
          id="ptr-indicator"
          className="
          fixed top-0 left-0 right-0 z-[9999]
          flex flex-col items-center justify-center
          pointer-events-none opacity-0
          transition-all duration-300
        "
        >
          <div className="bg-white shadow-md rounded-b-2xl px-4 py-2 flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium text-gray-700">Refreshing…</span>
          </div>
        </div>

        <StudentAuthPage />
      </>
    );
  }

  /* ------------------------------------------------------------------
     ROLE-BASED ROUTES — UNTOUCHED
  ------------------------------------------------------------------ */
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
        return (
          <div className="flex items-center justify-center h-full">
            <p>Verifying user role...</p>
          </div>
        );
    }
  };

  return (
    <HashRouter>
      {/* GLOBAL pull-to-refresh indicator */}
      <div
        id="ptr-indicator"
        className="
          fixed top-0 left-0 right-0 z-[9999]
          flex flex-col items-center justify-center
          pointer-events-none opacity-0
          transition-all duration-300
        "
      >
        <div className="bg-white shadow-md rounded-b-2xl px-4 py-2 flex items-center gap-2">
          <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium text-gray-700">Refreshing…</span>
        </div>
      </div>

      <MainLayout>{renderRoutes()}</MainLayout>
    </HashRouter>
  );
};

export default App;
