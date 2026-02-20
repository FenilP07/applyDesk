import { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();

  // Hide nav on login page (optional)
  if (location.pathname === "/login") return null;

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <Link to="/dashboard" className="font-semibold">
          JobTracker
        </Link>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
            >
              Dashboard
            </Link>
            <Link
              to="/jobs"
              className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
            >
              Jobs
            </Link>

            <div className="hidden sm:flex items-center gap-2 pl-2">
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="h-7 w-7 rounded-full"
                />
              ) : null}
              <span className="text-sm text-gray-600">{user?.name}</span>
            </div>

            <button
              onClick={logout}
              className="rounded-lg px-3 py-1 text-sm hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

export default function App() {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />

      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}
