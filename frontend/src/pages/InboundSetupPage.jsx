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

// ─── CONFIGURATION & THEME ──────────────────────────────────────────────────

const THEME = {
  fontSans: "'DM Sans', sans-serif",
  fontSerif: "'Lora', serif",
  colors: {
    textMain: "#1C1917",
    textMuted: "#78716C",
    border: "#E8E4DE",
    bgLight: "#FDFCFB",
    primary: "#1C1917",
    accentBlue: "#0369A1",
    accentGreen: "#166534",
  },
};

// ─── REUSABLE UI COMPONENTS ─────────────────────────────────────────────────

const SectionCard = ({ children, style = {} }) => (
  <section
    style={{
      background: "white",
      padding: "2rem",
      borderRadius: "24px",
      border: `1px solid ${THEME.colors.border}`,
      marginBottom: "2rem",
      ...style,
    }}
  >
    {children}
  </section>
);

const Badge = ({
  icon: Icon,
  text,
  color = THEME.colors.textMuted,
  bg = "#F5F5F4",
}) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      background: bg,
      padding: "8px 16px",
      borderRadius: "999px",
      color: color,
      fontSize: "0.85rem",
      fontWeight: 600,
      marginBottom: "1rem",
    }}
  >
    <Icon size={14} /> {text}
  </div>
);

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

function InboundSetupPage() {
  const { user } = useAuthStore();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedFilter, setCopiedFilter] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testDone, setTestDone] = useState(false);

  const forwardingEmail = `${user?.inboundPrefix}@applydesk.live`;
  const filterQuery = `(
  from:(linkedin.com OR "jobs-noreply@linkedin.com" OR greenhouse.io OR lever.co OR workday.com OR icims.com OR taleo.net OR smartrecruiters.com OR myworkday.com)
  OR subject:(
    "your application" OR "application received" OR "application submitted" OR
    "application was sent to" OR "thanks for applying" OR "thank you for applying" OR
    interview OR "phone screen" OR "schedule" OR "availability" OR "calendar invite" OR
    offer OR "employment offer" OR "compensation" OR "salary" OR
    "not moving forward" OR "regret to inform" OR unfortunately OR rejected OR declined
  )
)
-("unsubscribe" OR "manage your email preferences" OR "privacy policy" OR "terms of service" OR newsletter OR marketing OR promotion OR sale OR webinar OR "event reminder")`;

  const copyToClipboard = (text, setter) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
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
        fontFamily: THEME.fontSans,
      }}
    >
      {/* Header */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1
          style={{
            fontFamily: THEME.fontSerif,
            fontSize: "2.5rem",
            color: THEME.colors.textMain,
            marginBottom: "1rem",
          }}
        >
          Connect your Inbox
        </h1>
        <p
          style={{
            color: THEME.colors.textMuted,
            fontSize: "1.1rem",
            lineHeight: "1.6",
          }}
        >
          Automate your job search by forwarding application updates directly to
          your dashboard.
        </p>
      </header>

      {/* Step 1: Forwarding Email */}
      <SectionCard style={{ textAlign: "center" }}>
        <Badge icon={Mail} text="1. YOUR UNIQUE ADDRESS" />
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
              color: THEME.colors.textMain,
              background: THEME.colors.bgLight,
              padding: "12px 24px",
              borderRadius: "12px",
              border: `1px solid ${THEME.colors.border}`,
            }}
          >
            {forwardingEmail}
          </code>
          <button
            onClick={() => copyToClipboard(forwardingEmail, setCopiedEmail)}
            style={{
              padding: "12px",
              borderRadius: "12px",
              border: "none",
              background: THEME.colors.primary,
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
            color: THEME.colors.accentBlue,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          Open Gmail Forwarding Settings <ExternalLink size={12} />
        </a>
      </SectionCard>

      {/* Step 2: Filter Query */}
      <SectionCard style={{ background: "#F8FAFC", borderColor: "#E2E8F0" }}>
        <Badge
          icon={Filter}
          text="2. THE SMART FILTER QUERY"
          color="#0369A1"
          bg="#E0F2FE"
        />
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
            onClick={() => copyToClipboard(filterQuery, setCopiedFilter)}
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
      </SectionCard>

      {/* Step 3: Instructions List */}
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
                border: `1px solid ${THEME.colors.border}`,
              }}
            >
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: THEME.colors.primary,
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
                    color: THEME.colors.textMain,
                    marginBottom: "0.4rem",
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: THEME.colors.textMuted,
                    lineHeight: "1.5",
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Test Section */}
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
              color: THEME.colors.accentGreen,
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
                background: THEME.colors.accentGreen,
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
                color: THEME.colors.accentGreen,
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
