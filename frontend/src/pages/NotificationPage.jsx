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
  Loader2,
} from "lucide-react";

// --- LOCAL THEME & STYLES ---
const COLORS = {
  textMain: "#1C1917",
  textMuted: "#A8A29E",
  border: "#E8E4DE",
  primary: "#1C1917",
  accentBlue: "#0369A1",
  accentRed: "#BE123C",
  bgUnread: "#F8FAFC",
  bgRead: "#FFFFFF",
};

const UI_STYLES = {
  card: {
    background: "white",
    borderRadius: "20px",
    border: `1px solid ${COLORS.border}`,
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    background: COLORS.primary,
    color: "white",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
};

export default function NotificationPage() {
  const { id } = useParams();
  const { currentNotification, notifications, fetchNotificationById, loading } =
    useNotificationStore();

  useEffect(() => {
    if (id) fetchNotificationById(id);
  }, [id, fetchNotificationById]);

  // Format Helper
  const formatDate = (date, full = false) => {
    const d = new Date(date);
    return full
      ? d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" })
      : d.toLocaleDateString();
  };

  // --- 1. DETAIL VIEW (Single Notification) ---
  if (id) {
    if (loading)
      return (
        <div
          style={{
            padding: "5rem",
            textAlign: "center",
            color: COLORS.textMuted,
          }}
        >
          Loading...
        </div>
      );
    if (!currentNotification)
      return (
        <div style={{ padding: "5rem", textAlign: "center" }}>Not found.</div>
      );

    const isSystem = currentNotification.type === "system";

    return (
      <div
        style={{
          maxWidth: "650px",
          margin: "2.5rem auto",
          padding: "0 1.5rem",
          fontFamily: "sans-serif",
        }}
      >
        <Link
          to="/notifications"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: COLORS.textMuted,
            textDecoration: "none",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          <ArrowLeft size={16} /> Back to all notifications
        </Link>

        <div
          style={{
            ...UI_STYLES.card,
            padding: "2.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: isSystem ? COLORS.accentBlue : COLORS.accentRed,
              marginBottom: "1.25rem",
            }}
          >
            {isSystem ? <Info size={18} /> : <Briefcase size={18} />}
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.75rem",
                textTransform: "uppercase",
              }}
            >
              {currentNotification.type} Notification
            </span>
          </div>

          <h2
            style={{
              fontSize: "1.4rem",
              color: COLORS.textMain,
              marginBottom: "1.5rem",
              fontFamily: "'Lora', serif",
              fontWeight: 500,
            }}
          >
            {currentNotification.message}
          </h2>

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
                Please click below to take action:
              </p>
              <a
                href={currentNotification.link}
                target="_blank"
                rel="noopener noreferrer"
                style={UI_STYLES.button}
              >
                Go to Action <ExternalLink size={16} />
              </a>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: COLORS.textMuted,
              fontSize: "0.8rem",
              borderTop: `1px solid ${COLORS.border}`,
              paddingTop: "1.5rem",
            }}
          >
            <Clock size={14} /> Sent{" "}
            {formatDate(currentNotification.createdAt, true)}
          </div>
        </div>
      </div>
    );
  }

  // --- 2. LIST VIEW (All Notifications) ---
  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "3rem auto",
        padding: "0 1.5rem",
        fontFamily: "sans-serif",
      }}
    >
      <header style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 600,
            color: COLORS.textMain,
            fontFamily: "'Lora', serif",
          }}
        >
          Notifications
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: "0.9rem" }}>
          Stay updated with your applications.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {notifications.length === 0 ? (
          <div
            style={{
              ...UI_STYLES.card,
              textAlign: "center",
              padding: "4rem",
              borderStyle: "dashed",
            }}
          >
            <Bell
              size={32}
              style={{ color: COLORS.border, marginBottom: "1rem" }}
            />
            <p style={{ color: COLORS.textMuted }}>No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <Link
              key={n._id}
              to={`/notifications/${n._id}`}
              style={{
                display: "block",
                padding: "1.25rem 1.5rem",
                background: n.read ? COLORS.bgRead : COLORS.bgUnread,
                border: `1px solid ${n.read ? COLORS.border : "#E2E8F0"}`,
                borderRadius: "16px",
                textDecoration: "none",
                color: "inherit",
                transition: "transform 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.transform = "translateX(4px)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.transform = "translateX(0)")
              }
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
                    color: COLORS.textMain,
                    fontSize: "0.95rem",
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
                      background: COLORS.accentRed,
                      marginTop: "6px",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: "0.75rem",
                  color: COLORS.textMuted,
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <Clock size={12} /> {formatDate(n.createdAt)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
