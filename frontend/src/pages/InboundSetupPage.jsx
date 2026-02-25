import React, { useState } from "react";
import useAuthStore from "../store/authStore";
import {
  Copy,
  Check,
  Mail,
  Settings,
  ExternalLink,
  Filter,
  PlayCircle,
  Loader2,
} from "lucide-react";
import { authApi } from "../api/authApi";

function InboundSetupPage() {
  const { user } = useAuthStore();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedFilter, setCopiedFilter] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testDone, setTestDone] = useState(false);

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

  const runTest = async () => {
    setIsTesting(true);
    try {
      await authApi.test();
      setTestDone(true);
    } catch (error) {
      alert("Test failed. Make sure your server is running.");
    } finally {
      setIsTesting(false);
    }
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
          your dashboard.
        </p>
      </header>

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
          <Mail size={14} /> 1. YOUR UNIQUE ADDRESS
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
        <a
          href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: "0.85rem",
            color: "#0369A1",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Open Gmail Forwarding Settings <ExternalLink size={12} />
        </a>
      </section>

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
          Copy this into the <strong>"Has the words"</strong> field in your
          Gmail filter settings:
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
          <Settings size={20} /> Finalize Setup
        </h2>

        <div style={{ display: "grid", gap: "1.5rem", marginBottom: "3rem" }}>
          {[
            {
              title: "Add Forwarding",
              desc: "Paste your unique address into Gmail's Forwarding settings.",
            },
            {
              title: "Create Filter",
              desc: "Create a filter using the query above and set it to forward to your unique address.",
            },
            {
              title: "Confirm Gmail",
              desc: "Click the verification link sent by Google (it will appear in your dashboard notifications).",
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

        <div
          style={{
            padding: "2rem",
            backgroundColor: "#F0FDF4",
            borderRadius: "24px",
            border: "1px solid #BBF7D0",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              color: "#166534",
              marginTop: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Ready to test?
          </h3>
          <p
            style={{
              color: "#15803D",
              fontSize: "0.9rem",
              marginBottom: "1.5rem",
            }}
          >
            We'll simulate a LinkedIn application email to verify your AI
            extraction logic.
          </p>

          {!testDone ? (
            <button
              onClick={runTest}
              disabled={isTesting}
              style={{
                background: "#166534",
                color: "white",
                border: "none",
                padding: "14px 28px",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "600",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {isTesting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <PlayCircle size={20} />
              )}
              {isTesting ? "Simulating Webhook..." : "Run Connection Test"}
            </button>
          ) : (
            <div
              style={{
                color: "#166534",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Check size={24} /> Connection Verified! Check your Notifications.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default InboundSetupPage;
