import { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { LayoutDashboard, Briefcase, LogOut, Sparkles } from "lucide-react";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();

  if (location.pathname === "/login") return null;

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Jobs", path: "/jobs", icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200 transition-transform group-hover:scale-105">
            <Sparkles size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            Apply<span className="text-blue-600">Desk</span>
          </span>
        </Link>

        {isAuthenticated && (
          <div className="flex items-center gap-1 sm:gap-4">
            {/* Navigation Links */}
            <nav className="flex items-center border-r border-gray-100 pr-2 sm:pr-4">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      isActive 
                        ? "text-blue-600 bg-blue-50" 
                        : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="hidden md:inline">{link.name}</span>
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-1/2 h-1 w-8 -translate-x-1/2 rounded-t-full bg-blue-600" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Profile & Logout */}
            <div className="flex items-center gap-3 pl-1 sm:pl-2">
              <div className="hidden items-center gap-2 sm:flex">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900 leading-none">{user?.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Pro Member</span>
                </div>
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="h-9 w-9 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-100"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                    {user?.name?.charAt(0) || "U"}
                  </div>
                )}
              </div>

              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        )}
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <TopNav />

      <main className="relative">
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
      </main>
      
      {/* Optional: Footer or floating elements could go here */}
    </div>
  );
}