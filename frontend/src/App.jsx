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
  Settings,
} from "lucide-react";
import useNotificationStore from "./store/notificationStore";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import JobsPage from "./pages/JobsPage";
import NotificationPage from "./pages/NotificationPage";
import InboundSetupPage from "./pages/InboundSetupPage";

function TopNav() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const { notifications, unreadCount, fetchAllNotifications } =
    useNotificationStore();

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
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Applications", path: "/jobs", icon: Briefcase },
    { name: "Configure", path: "/setup", icon: Settings },
  ];

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(247,245,242,0.92)",
        backdropFilter: "blur(18px)",
        borderBottom: "1px solid #E8E4DE",
        height: "64px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 3rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* LOGO */}
      <Link
        to="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "7px",
            background: "#1C1917",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
        <span
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "1.1rem",
            fontWeight: 600,
            color: "#1C1917",
            letterSpacing: "-0.3px",
          }}
        >
          applyDesk
        </span>
      </Link>

      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          {/* NAV LINKS */}
          <nav style={{ display: "flex", gap: "6px" }}>
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
                    padding: "7px 14px",
                    borderRadius: "10px",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    transition: "all 0.2s ease",
                    color: active ? "#1C1917" : "#78716C",
                    background: active ? "#EFEDE9" : "transparent",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "#F7F5F2";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <Icon size={15} />
                  {name}
                </Link>
              );
            })}
          </nav>

          {/* RIGHT SECTION */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* NOTIFICATIONS */}
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setOpen(!open)}
                style={{
                  position: "relative",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                }}
              >
                <Bell size={17} />

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      minWidth: "18px",
                      height: "18px",
                      borderRadius: "999px",
                      background: "#BE123C",
                      color: "white",
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {open && (
                <div
                  style={{
                    position: "absolute",
                    top: "42px",
                    right: 0,
                    width: "340px",
                    background: "white",
                    borderRadius: "14px",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
                    border: "1px solid #E8E4DE",
                    overflow: "hidden",
                    animation: "fadeIn 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      padding: "14px",
                      fontWeight: 600,
                      borderBottom: "1px solid #E8E4DE",
                      fontSize: "0.85rem",
                    }}
                  >
                    Notifications
                  </div>

                  <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "18px", fontSize: "0.85rem" }}>
                        You're all caught up ✨
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            setOpen(false);
                            navigate(`/notifications/${n._id}`);
                          }}
                          style={{
                            padding: "14px",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            background: n.read ? "white" : "#F0F9FF",
                            borderBottom: "1px solid #F1F5F9",
                            transition: "background 0.2s",
                          }}
                        >
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    style={{
                      padding: "12px",
                      textAlign: "center",
                      background: "#FAFAF9",
                      borderTop: "1px solid #E8E4DE",
                    }}
                  >
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/notifications");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1C1917",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                      }}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* USER SECTION */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                paddingLeft: "12px",
                borderLeft: "1px solid #E8E4DE",
              }}
            >
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    color: "#1C1917",
                  }}
                >
                  {user?.name}
                </div>
              </div>

              {user?.picture ? (
                <img
                  src={user.picture}
                  alt="Profile"
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "#EFEDE9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {user?.name?.charAt(0) ?? "U"}
                </div>
              )}

              <button
                onClick={logout}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                }}
              >
                <LogOut size={16} />
              </button>
            </div>
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
          <Route
            path="/setup"
            element={<InboundSetupPage></InboundSetupPage>}
          />
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
          {/* Main notifications list */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationPage />
              </ProtectedRoute>
            }
          />
          {/* Specific notification detail view */}
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
