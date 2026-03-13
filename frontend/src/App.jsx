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
import {
  LayoutDashboard,
  Briefcase,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";
import useNotificationStore from "./store/notificationStore";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import NotificationPage from "./pages/NotificationPage";
import LandingPage from "./pages/LandingPage"

// ─── HOOK: responsive window width ───────────────────────────────────────────

function useWindowWidth() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

// ─── TOP NAV ─────────────────────────────────────────────────────────────────

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const { notifications, unreadCount, fetchAllNotifications } =
    useNotificationStore();

  const location = useLocation();
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1024;

  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) fetchAllNotifications();
  }, [isAuthenticated]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (location.pathname === "/login" || location.pathname === "/") return null;

  const navLinks = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/jobs", icon: Briefcase },
  ];

  return (
    <>
      <style>{`
        .nav-link:hover { background: #F5F3F0 !important; color: #1C1917 !important; }
        .bell-btn:hover { background: #EFEDE9 !important; }
        .avatar-wrap:hover { border-color: #D6D3CF !important; }
        .logout-btn:hover { color: #78716C !important; background: #F5F3F0 !important; }
        .notif-item:hover { background: #FAFAF9; }
        .badge-pulse { animation: pulse 2s infinite; }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slideDown {
          from { transform: translateY(-8px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .mobile-drawer { animation: slideDown 0.2s ease; }
      `}</style>

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(247,245,242,0.94)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid #E8E4DE",
          height: "60px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.25rem",
          gap: "12px",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* ── LEFT: Logo + Mobile Hamburger ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {isAuthenticated && isMobile && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              style={{
                background: "none",
                border: "none",
                padding: "4px",
                display: "flex",
                cursor: "pointer",
                color: "#57534E",
              }}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}

          <Link
            to="/dashboard"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "#1C1917",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            {
              <span
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "#1C1917",
                  letterSpacing: "-0.01em",
                }}
              >
                applyDesk
              </span>
            }
          </Link>
        </div>

        {/* ── CENTER: Desktop Nav (truly centered via grid) ── */}
        {isAuthenticated && !isMobile && (
          <nav
            style={{ display: "flex", gap: "2px" }}
            aria-label="Main navigation"
          >
            {navLinks.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className="nav-link"
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 13px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: active ? 600 : 500,
                    color: active ? "#1C1917" : "#78716C",
                    background: active ? "#EFEDE9" : "transparent",
                    textDecoration: "none",
                    borderLeft: active
                      ? "2px solid #1C1917"
                      : "2px solid transparent",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <Icon size={14} />
                  {name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* ── RIGHT: Notifications + User ── */}
        {isAuthenticated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              justifyContent: "flex-end",
            }}
          >
            {/* Bell */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                className="bell-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "10px",
                  background: notifOpen ? "#EFEDE9" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#57534E",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span
                    className="badge-pulse"
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#BE123C",
                      border: "2px solid #F7F5F2",
                    }}
                  />
                )}
              </button>

              {notifOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "46px",
                    right: 0,
                    width: "300px",
                    background: "white",
                    borderRadius: "14px",
                    border: "1px solid #E8E4DE",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.09)",
                    overflow: "hidden",
                    animation: "slideDown 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 16px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#1C1917",
                      borderBottom: "1px solid #F0EDE9",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    Notifications
                    {unreadCount > 0 && (
                      <span
                        style={{
                          background: "#FEF2F2",
                          color: "#BE123C",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 7px",
                          borderRadius: "20px",
                        }}
                      >
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div
                        style={{
                          padding: "28px 20px",
                          textAlign: "center",
                          fontSize: "0.78rem",
                          color: "#A0A0A0",
                        }}
                      >
                        <div
                          style={{
                            marginBottom: "6px",
                            opacity: 0.4,
                            fontSize: "1.2rem",
                          }}
                        >
                          🔔
                        </div>
                        <div>You're all caught up!</div>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className="notif-item"
                          style={{
                            padding: "12px 16px",
                            fontSize: "0.78rem",
                            borderBottom: "1px solid #F9F8F7",
                            color: "#44403C",
                            lineHeight: 1.5,
                            cursor: "pointer",
                            transition: "background 0.1s",
                          }}
                        >
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div
              style={{ width: "1px", height: "22px", background: "#E8E4DE" }}
            />

            {/* Avatar */}
            <div
              className="avatar-wrap"
              title={user?.name}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#EFEDE9",
                overflow: "hidden",
                border: "2px solid transparent",
                transition: "border-color 0.15s",
                cursor: "default",
                flexShrink: 0,
              }}
            >
              {user?.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#57534E",
                    background: "#E7E4DF",
                  }}
                >
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Logout */}
            <button
              className="logout-btn"
              onClick={logout}
              title="Log out"
              aria-label="Log out"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#C4BBBB",
                display: "flex",
                alignItems: "center",
                padding: "4px",
                borderRadius: "6px",
                transition: "color 0.15s, background 0.15s",
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div
          className="mobile-drawer"
          style={{
            position: "fixed",
            inset: 0,
            top: "60px",
            background: "#F7F5F2",
            zIndex: 45,
            padding: "16px",
            borderTop: "1px solid #E8E4DE",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {navLinks.map(({ name, path, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    background: active ? "#1C1917" : "white",
                    borderRadius: "12px",
                    border: "1px solid " + (active ? "#1C1917" : "#E8E4DE"),
                    textDecoration: "none",
                    color: active ? "white" : "#1C1917",
                    fontWeight: active ? 600 : 500,
                    fontSize: "0.9rem",
                  }}
                >
                  <Icon size={18} />
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const { bootstrap, isAuthenticated } = useAuthStore(); // Added isAuthenticated here
  const windowWidth = useWindowWidth();

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F5F2" }}>
      <TopNav />
      {/* Added a max-width container for better desktop readability */}
      <main
        style={{
          padding: windowWidth < 768 ? "1rem" : "2rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LandingPage /> // Ensure this is imported!
              )
            }
          />
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
