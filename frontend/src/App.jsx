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
    if (isAuthenticated) {
      fetchAllNotifications();
    }
  }, [isAuthenticated, fetchAllNotifications]);

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
    { name: "Configure", path: "setup", icon: Settings },
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
          }}
        >
          applyDesk
        </span>
      </Link>

      {isAuthenticated && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
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
                  }}
                >
                  <Icon size={15} />
                  <span>{name}</span>
                </Link>
              );
            })}

            {/* 🔔 Notification Dropdown */}
            <div
              style={{ position: "relative", padding: "6px 12px" }}
              ref={dropdownRef}
            >
              <div
                onClick={() => setOpen(!open)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Bell size={15} />

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-6px",
                      right: "-8px",
                      minWidth: "16px",
                      height: "16px",
                      borderRadius: "999px",
                      background: "#BE123C",
                      color: "white",
                      fontSize: "0.6rem",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                    }}
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>

              {open && (
                <div
                  style={{
                    position: "absolute",
                    top: "36px",
                    right: 0,
                    width: "320px",
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                    border: "1px solid #E8E4DE",
                    overflow: "hidden",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      fontWeight: 600,
                      borderBottom: "1px solid #E8E4DE",
                      fontSize: "0.85rem",
                    }}
                  >
                    Notifications
                  </div>

                  <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "16px", fontSize: "0.85rem" }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            setOpen(false);
                            // Navigate to the specific notification detail page
                            navigate(`/notifications/${n._id}`);
                          }}
                          style={{
                            padding: "12px 14px",
                            cursor: "pointer",
                            background: n.read ? "white" : "#F0F9FF",
                            borderBottom: "1px solid #F1F5F9",
                            fontSize: "0.8rem",
                          }}
                        >
                          {n.message}
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    style={{
                      padding: "10px",
                      textAlign: "center",
                      background: "#FAFAF9",
                      borderTop: "1px solid #E8E4DE",
                    }}
                  >
                    <button
                      onClick={() => {
                        setOpen(false);
                        // Navigate to the general notifications list
                        navigate("/notifications");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#1C1917",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        width: "100%",
                      }}
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div
            style={{ width: "1px", height: "20px", background: "#E8E4DE" }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.78rem",
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
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                }}
              />
            ) : (
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  background: "#EFEDE9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {user?.name?.charAt(0) ?? "U"}
              </div>
            )}

            <button
              onClick={logout}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
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
