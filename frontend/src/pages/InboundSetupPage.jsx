import React, { useState } from "react";
import useAuthStore from "../store/authStore";
import {
  Copy,
  Check,
  Mail,
  Settings,
  ExternalLink,
  Filter,
  Info,
} from "lucide-react";

function InboundSetupPage() {
  const { user } = useAuthStore();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedFilter, setCopiedFilter] = useState(false);

  const forwardingEmail = `${user?.inboundPrefix}@applydesk.live`;
  const filterQuery = `subject:(application OR "received your application" OR "applying for" OR interview OR "hiring team" OR "recruiter" OR "status of your application")`;

  const copyEmail = () => {
    navigator.clipboard.writeText(forwardingEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const copyFilter = () => {
    navigator.clipboard.writeText(filterQuery);
    setCopiedFilter(true);
    setTimeout(() => setCopiedFilter(false), 2000);
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "4rem auto",
        padding: "0 1.5rem",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1
          style={{
            fontFamily: "'Lora', serif",
            fontSize: "2.5rem",
            color: "#1C1917",
            marginBottom: "1rem",
          }}
        >
          Connect your Inbox
        </h1>
        <p style={{ color: "#78716C", fontSize: "1.1rem", lineHeight: "1.6" }}>
          Automate your job search by forwarding application updates directly to
          your applyDesk dashboard.
        </p>
      </header>

      {/* --- Step 1: The Address --- */}
      <section
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "24px",
          border: "1px solid #E8E4DE",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#F5F5F4",
            padding: "8px 16px",
            borderRadius: "999px",
            color: "#78716C",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          <Mail size={14} /> 1. YOUR UNIQUE FORWARDING ADDRESS
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "1rem",
          }}
        >
          <code
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#1C1917",
              background: "#FDFCFB",
              padding: "12px 24px",
              borderRadius: "12px",
              border: "1px solid #E8E4DE",
            }}
          >
            {forwardingEmail}
          </code>
          <button
            onClick={copyEmail}
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: "#1C1917",
              color: "white",
              cursor: "pointer",
            }}
          >
            {copiedEmail ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#A8A29E" }}>
          Add this address in Gmail Settings &gt; Forwarding
        </p>
      </section>

      {/* --- Step 2: The Filter --- */}
      <section
        style={{
          background: "#F8FAFC",
          padding: "2rem",
          borderRadius: "24px",
          border: "1px solid #E2E8F0",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#E0F2FE",
            padding: "8px 16px",
            borderRadius: "999px",
            color: "#0369A1",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "1rem",
          }}
        >
          <Filter size={14} /> 2. THE SMART FILTER QUERY
        </div>
        <p
          style={{
            fontSize: "0.9rem",
            color: "#475569",
            marginBottom: "1.5rem",
          }}
        >
          Copy this query into the <strong>"Has the words"</strong> field when
          creating your Gmail filter:
        </p>
        <div
          style={{
            position: "relative",
            background: "white",
            padding: "1.25rem",
            borderRadius: "12px",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <code
            style={{
              fontSize: "0.85rem",
              color: "#1E293B",
              lineHeight: "1.6",
              flex: 1,
              wordBreak: "break-all",
            }}
          >
            {filterQuery}
          </code>
          <button
            onClick={copyFilter}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748B",
              padding: "4px",
            }}
          >
            {copiedFilter ? (
              <Check size={18} color="#10B981" />
            ) : (
              <Copy size={18} />
            )}
          </button>
        </div>
      </section>

      {/* --- Step 3: Instructions --- */}
      <section>
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Settings size={20} /> Final Configuration
        </h2>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          {[
            {
              title: "Create the Filter",
              desc: "In Gmail, click the search options icon and paste the query into 'Has the words'.",
            },
            {
              title: "Assign Forwarding",
              desc: "Choose 'Create Filter', check 'Forward it to', and select your applyDesk address.",
            },
            {
              title: "Check Notifications",
              desc: "Watch your applyDesk notifications for the Google verification link to confirm.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                gap: "1.5rem",
                alignItems: "flex-start",
                padding: "1.5rem",
                background: "white",
                borderRadius: "16px",
                border: "1px solid #E8E4DE",
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "#1C1917",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#1C1917",
                    marginBottom: "0.4rem",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#78716C",
                    lineHeight: "1.5",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default InboundSetupPage;
