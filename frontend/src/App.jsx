import { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import { LayoutDashboard, Briefcase, LogOut, Bell } from "lucide-react";
import useNotificationStore from "./store/notificationStore";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import NotificationPage from "./pages/NotificationPage";
import InboundSetupPage from "./pages/InboundSetupPage";

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const { notifications, unreadCount, fetchAllNotifications } = useNotificationStore();

  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchAllNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (location.pathname === "/login") return null;

  const navLinks = [
    { name: "Dashboard",    path: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/jobs",       icon: Briefcase       },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247,245,242,0.92)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid #E8E4DE",
        height: "60px",
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
        style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none" }}
      >
        <div
          style={{
            width: "26px", height: "26px", borderRadius: "8px",
            background: "#1C1917",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
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
            letterSpacing: "-0.3px",
          }}
        >
          applyDesk
        </span>
      </Link>

      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>

          {/* Nav links */}
          <nav style={{ display: "flex", gap: "4px" }}>
            {navLinks.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 13px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: active ? 600 : 500,
                    transition: "all 0.15s ease",
                    color:      active ? "#1C1917" : "#78716C",
                    background: active ? "#EFEDE9"  : "transparent",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "#F0EEE9"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                >
                  <Icon size={14} />
                  {name}
                </Link>
              );
            })}
          </nav>

          {/* Right section */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            {/* Notifications */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setOpen(!open)}
                style={{
                  position: "relative",
                  width: "34px", height: "34px",
                  borderRadius: "10px",
                  background: open ? "#EFEDE9" : "transparent",
                  border: "1px solid transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  color: "#57534E",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EFEDE9"; }}
                onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute", top: "3px", right: "3px",
                      minWidth: "16px", height: "16px",
                      borderRadius: "999px",
                      background: "#BE123C", color: "white",
                      fontSize: "0.58rem", fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "1.5px solid rgba(247,245,242,0.9)",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div
                  style={{
                    position: "absolute", top: "44px", right: 0,
                    width: "320px",
                    background: "white",
                    borderRadius: "14px",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)",
                    border: "1px solid #E8E4DE",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 16px",
                      borderBottom: "1px solid #EFEDE9",
                      fontSize: "0.8rem", fontWeight: 700,
                      color: "#1C1917",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span style={{
                        background: "#FFF1F2", color: "#BE123C",
                        borderRadius: "10px", padding: "1px 7px",
                        fontSize: "0.6rem", fontWeight: 700,
                      }}>
                        {unreadCount} new
                      </span>
                    )}
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "20px 16px", fontSize: "0.82rem", color: "#A8A29E", textAlign: "center" }}>
                        You're all caught up ✨
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => { setOpen(false); navigate(`/notifications/${n._id}`); }}
                          style={{
                            padding: "12px 16px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            color: "#44403C",
                            lineHeight: 1.45,
                            background: n.read ? "white" : "#F0F9FF",
                            borderBottom: "1px solid #F5F3F0",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#FAFAF9"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = n.read ? "white" : "#F0F9FF"; }}
                        >
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    style={{
                      padding: "10px 16px",
                      background: "#FAFAF9",
                      borderTop: "1px solid #EFEDE9",
                      textAlign: "center",
                    }}
                  >
                    <button
                      onClick={() => { setOpen(false); navigate("/notifications"); }}
                      style={{
                        background: "none", border: "none",
                        color: "#57534E", fontSize: "0.78rem", fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      View all notifications →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User section */}
            <div
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                paddingLeft: "12px",
                borderLeft: "1px solid #E8E4DE",
              }}
            >
              <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#44403C" }}>
                {user?.name}
              </span>

              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "30px", height: "30px", borderRadius: "50%",
                    background: "#EFEDE9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.75rem", fontWeight: 700, color: "#57534E",
                    flexShrink: 0,
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
              )}

              <button
                onClick={logout}
                title="Log out"
                style={{
                  width: "30px", height: "30px",
                  borderRadius: "8px",
                  background: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#A8A29E",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#EFEDE9"; e.currentTarget.style.color = "#1C1917"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#A8A29E"; }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

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
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications/:id"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}