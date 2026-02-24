import { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { LayoutDashboard, Briefcase, LogOut } from "lucide-react";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const location = useLocation();

  if (location.pathname === "/login") return null;

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/jobs", icon: Briefcase },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: "rgba(247,245,242,0.92)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid #E8E4DE",
        height: "58px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 2.5rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Logo */}
      <Link
        to="/dashboard"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <div
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            background: "#1C1917",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "#1C1917",
            letterSpacing: "-0.02em",
          }}
        >
          applyDesk
        </span>
      </Link>

      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {navLinks.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    color: active ? "#1C1917" : "#A8A29E",
                    background: active ? "#EFEDE9" : "transparent",
                    textDecoration: "none",
                    transition: "all 0.15s",
                    letterSpacing: "0.01em",
                  }}
                >
                  <Icon size={15} />
                  <span>{name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div
            style={{ width: "1px", height: "20px", background: "#E8E4DE" }}
          />

          {/* User + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  color: "#1C1917",
                  lineHeight: 1,
                }}
              >
                {user?.name}
              </div>
              <div
                style={{
                  fontSize: "0.62rem",
                  color: "#A8A29E",
                  marginTop: "2px",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Active search
              </div>
            </div>

            {user?.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  border: "1px solid #E8E4DE",
                }}
              />
            ) : (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#EFEDE9",
                  border: "1px solid #E8E4DE",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  color: "#57534E",
                }}
              >
                {user?.name?.charAt(0) ?? "U"}
              </div>
            )}

            <button
              onClick={logout}
              title="Sign out"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "none",
                border: "1px solid transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#A8A29E",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FFF1F2";
                e.currentTarget.style.borderColor = "#FECDD3";
                e.currentTarget.style.color = "#BE123C";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.color = "#A8A29E";
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default function App() {
  const { bootstrap } = useAuthStore();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F2" }}>
      <TopNav />
      <main>
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
    </div>
  );
}
