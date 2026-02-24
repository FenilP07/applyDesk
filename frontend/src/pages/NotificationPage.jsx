import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import useNotificationStore from "../store/notificationStore";
import {
  ArrowLeft,
  Clock,
  Bell,
  ExternalLink,
  Info,
  Briefcase,
} from "lucide-react";

export default function NotificationPage() {
  const { id } = useParams();
  const { currentNotification, notifications, fetchNotificationById, loading } =
    useNotificationStore();

  useEffect(() => {
    if (id) {
      fetchNotificationById(id);
    }
  }, [id, fetchNotificationById]);

  // --- 1. DETAIL VIEW (Single Notification) ---
  if (id) {
    if (loading) {
      return (
        <div style={{ padding: "3rem", textAlign: "center", color: "#A8A29E" }}>
          Loading notification details...
        </div>
      );
    }

    if (!currentNotification) {
      return (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <p>Notification not found.</p>
          <Link
            to="/notifications"
            style={{ color: "#1C1917", fontWeight: 600 }}
          >
            Return to list
          </Link>
        </div>
      );
    }

    const isSystem = currentNotification.type === "system";

    return (
      <div
        style={{
          maxWidth: "650px",
          margin: "2.5rem auto",
          padding: "0 1.5rem",
        }}
      >
        <Link
          to="/notifications"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#A8A29E",
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            transition: "color 0.2s",
          }}
          onMouseOver={(e) => (e.target.style.color = "#1C1917")}
          onMouseOut={(e) => (e.target.style.color = "#A8A29E")}
        >
          <ArrowLeft size={16} /> Back to all notifications
        </Link>

        <div
          style={{
            background: "white",
            padding: "2.5rem",
            borderRadius: "20px",
            border: "1px solid #E8E4DE",
            boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
          }}
        >
          {/* Header Label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: isSystem ? "#0369A1" : "#BE123C",
              marginBottom: "1.25rem",
            }}
          >
            {isSystem ? <Info size={18} /> : <Briefcase size={18} />}
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {currentNotification.type} Notification
            </span>
          </div>

          {/* Message */}
          <h2
            style={{
              fontSize: "1.4rem",
              color: "#1C1917",
              marginBottom: "1.5rem",
              lineHeight: "1.5",
              fontWeight: 500,
              fontFamily: "'Lora', serif",
            }}
          >
            {currentNotification.message}
          </h2>

          {/* 🔗 System Link / Action Section */}
          {currentNotification.link && (
            <div
              style={{
                marginBottom: "2rem",
                padding: "1.5rem",
                background: "#F8FAFC",
                borderRadius: "12px",
                border: "1px solid #E2E8F0",
              }}
            >
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#64748B",
                  marginBottom: "1rem",
                }}
              >
                This item requires your attention. Click below to proceed to the
                action page:
              </p>
              <a
                href={currentNotification.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  background: "#1C1917",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  transition: "transform 0.2s",
                }}
                onMouseOver={(e) =>
                  (e.target.style.transform = "translateY(-1px)")
                }
                onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
              >
                Go to Action <ExternalLink size={16} />
              </a>
            </div>
          )}

          {/* Footer Metadata */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "#A8A29E",
              fontSize: "0.8rem",
              borderTop: "1px solid #F5F5F4",
              paddingTop: "1.5rem",
            }}
          >
            <Clock size={14} />
            Sent{" "}
            {new Date(currentNotification.createdAt).toLocaleString(undefined, {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. LIST VIEW (All Notifications) ---
  return (
    <div
      style={{ maxWidth: "800px", margin: "3rem auto", padding: "0 1.5rem" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.8rem",
              fontWeight: 600,
              color: "#1C1917",
              fontFamily: "'Lora', serif",
            }}
          >
            Notifications
          </h1>
          <p style={{ color: "#A8A29E", fontSize: "0.9rem", marginTop: "4px" }}>
            Stay updated with your applications and system alerts.
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "4rem",
              background: "white",
              borderRadius: "16px",
              border: "1px dashed #E8E4DE",
            }}
          >
            <Bell
              size={32}
              style={{ color: "#E8E4DE", marginBottom: "1rem" }}
            />
            <p style={{ color: "#A8A29E" }}>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n._id}
              to={`/notifications/${n._id}`}
              style={{
                display: "block",
                padding: "1.25rem 1.5rem",
                background: n.read ? "white" : "#F8FAFC",
                border: "1px solid",
                borderColor: n.read ? "#E8E4DE" : "#E2E8F0",
                borderRadius: "16px",
                textDecoration: "none",
                color: "inherit",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
                e.currentTarget.style.borderColor = "#D6D3D1";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                e.currentTarget.style.borderColor = n.read
                  ? "#E8E4DE"
                  : "#E2E8F0";
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    fontWeight: n.read ? 400 : 600,
                    color: "#1C1917",
                    fontSize: "0.95rem",
                    lineHeight: "1.4",
                  }}
                >
                  {n.message}
                </div>
                {!n.read && (
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#BE123C",
                      flexShrink: 0,
                      marginTop: "6px",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#A8A29E",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={12} />
                {new Date(n.createdAt).toLocaleDateString()}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
