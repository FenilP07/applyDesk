import React, { useEffect, useMemo } from "react";
import useJobStore from "../store/jobStore";
import { Plus } from "lucide-react";

const STATUSES = [
  { key: "total", label: "Total", dot: "#A8A29E" },
  { key: "applied", label: "Applied", dot: "#1D4ED8" },
  { key: "interview", label: "Interviews", dot: "#B45309" },
  { key: "offer", label: "Offers", dot: "#2D6A4F" },
  { key: "rejected", label: "Rejected", dot: "#BE123C" },
];

const FUNNEL = [
  { key: "applied", label: "Applied", fill: "#BFDBFE" },
  { key: "interview", label: "Interview", fill: "#FDE68A" },
  { key: "offer", label: "Offer", fill: "#6EE7B7" },
  { key: "rejected", label: "Rejected", fill: "#FECDD3" },
];

const PILL_STYLES = {
  applied: {
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #DBEAFE",
  },
  interview: {
    background: "#FEF3C7",
    color: "#B45309",
    border: "1px solid #FDE68A",
  },
  offer: {
    background: "#EAF4EF",
    color: "#2D6A4F",
    border: "1px solid #BBF7D0",
  },
  rejected: {
    background: "#FFF1F2",
    color: "#BE123C",
    border: "1px solid #FECDD3",
  },
};

function StatusPill({ status }) {
  const s = PILL_STYLES[status] ?? {};
  return (
    <span
      className="inline-flex items-center rounded-full text-xs font-semibold capitalize"
      style={{
        padding: "3px 9px",
        fontSize: "0.62rem",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        ...s,
      }}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { summary, fetchSummary, fetchJobs, jobs } = useJobStore();

  useEffect(() => {
    fetchSummary();
    fetchJobs();
  }, [fetchSummary, fetchJobs]);

  const byStatus = summary?.byStatus ?? {};
  const total = summary?.total ?? 0;

  const maxVal = useMemo(
    () => Math.max(...FUNNEL.map((f) => byStatus[f.key] ?? 0), 1),
    [byStatus],
  );

  const conversionRate =
    total > 0 ? (((byStatus.interview ?? 0) / total) * 100).toFixed(1) : "0.0";

  const offerRate =
    total > 0 ? (((byStatus.offer ?? 0) / total) * 100).toFixed(1) : "0.0";

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const recent = [...(jobs ?? [])].slice(0, 4);

  return (
    <div
      className="min-h-screen"
      style={{ background: "#F7F5F2", fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-1"
              style={{ color: "#A8A29E", letterSpacing: "0.1em" }}
            >
              {today}
            </p>
            <h1
              className="text-3xl text-stone-900"
              style={{
                fontFamily: "'Lora', serif",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              Your Pipeline
            </h1>
            <p className="text-sm mt-1" style={{ color: "#A8A29E" }}>
              Here's where everything stands today.
            </p>
          </div>
          <button
            className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              background: "#1C1917",
              color: "#F7F5F2",
              padding: "9px 18px",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(28,25,23,0.12)",
            }}
          >
            <Plus size={14} />
            Add Application
          </button>
        </div>

        {/* Stats strip */}
        <div
          className="grid mb-8 overflow-hidden"
          style={{
            gridTemplateColumns: "repeat(5, 1fr)",
            background: "#E8E4DE",
            gap: "1px",
            border: "1px solid #E8E4DE",
            borderRadius: "16px",
          }}
        >
          {STATUSES.map(({ key, label, dot }) => (
            <div
              key={key}
              className="bg-white px-5 py-5 transition-colors hover:bg-stone-50"
            >
              <div className="flex items-center gap-1.5 mb-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: dot }}
                />
                <span
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#A8A29E", fontSize: "0.62rem" }}
                >
                  {label}
                </span>
              </div>
              <div
                className="text-stone-900"
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: "2rem",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                {key === "total" ? total : (byStatus[key] ?? 0)}
              </div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "1fr 300px" }}
        >
          {/* Left column */}
          <div className="flex flex-col gap-5">
            {/* Funnel card */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{ border: "1px solid #E8E4DE" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#A8A29E", fontSize: "0.62rem" }}
              >
                Application Funnel
              </p>
              <div className="flex flex-col gap-4 mb-6">
                {FUNNEL.map(({ key, label, fill }) => {
                  const val = byStatus[key] ?? 0;
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <span
                        className="text-sm font-medium w-16 flex-shrink-0"
                        style={{ color: "#57534E" }}
                      >
                        {label}
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "#EFEDE9" }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, background: fill }}
                        />
                      </div>
                      <span
                        className="text-xs font-medium w-5 text-right flex-shrink-0"
                        style={{ color: "#A8A29E" }}
                      >
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div
                className="flex flex-wrap gap-4 pt-5"
                style={{ borderTop: "1px solid #E8E4DE" }}
              >
                {FUNNEL.map(({ key, label, fill }) => (
                  <div key={key} className="flex items-center gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        background: fill,
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    />
                    <span className="text-xs" style={{ color: "#A8A29E" }}>
                      {label}{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "#57534E" }}
                      >
                        {byStatus[key] ?? 0}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent applications */}
            <div
              className="bg-white rounded-2xl p-7"
              style={{ border: "1px solid #E8E4DE" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: "#A8A29E", fontSize: "0.62rem" }}
                >
                  Recent Applications
                </p>
                <span
                  className="text-xs font-medium cursor-pointer"
                  style={{ color: "#A8A29E" }}
                >
                  View all →
                </span>
              </div>

              {recent.length === 0 ? (
                <p
                  className="text-sm text-center py-8"
                  style={{ color: "#A8A29E" }}
                >
                  No applications yet. Add one to get started.
                </p>
              ) : (
                <div>
                  {recent.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between py-3.5"
                      style={{ borderBottom: "1px solid #EFEDE9" }}
                    >
                      <div>
                        <div className="text-sm font-medium text-stone-900">
                          {job.title}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: "#A8A29E" }}
                        >
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <StatusPill status={job.status} />
                        <span className="text-xs" style={{ color: "#A8A29E" }}>
                          {job.dateApplied
                            ? new Date(job.dateApplied).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4">
            <div
              className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid #E8E4DE" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#A8A29E", fontSize: "0.62rem" }}
              >
                Apply → Interview
              </p>
              <div
                className="text-stone-900"
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: "2.4rem",
                  fontWeight: 600,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                {conversionRate}
                <span className="text-xl" style={{ color: "#A8A29E" }}>
                  %
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#A8A29E" }}>
                vs. 15% industry average
              </p>
              <div
                className="h-0.5 rounded-full mt-4 overflow-hidden"
                style={{ background: "#EFEDE9" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(parseFloat(conversionRate), 100)}%`,
                    background: "#1C1917",
                  }}
                />
              </div>
            </div>

            <div
              className="bg-white rounded-2xl p-6"
              style={{ border: "1px solid #E8E4DE" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-2"
                style={{ color: "#A8A29E", fontSize: "0.62rem" }}
              >
                Offer Rate
              </p>
              <div
                className="text-stone-900"
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: "2.4rem",
                  fontWeight: 600,
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                }}
              >
                {offerRate}
                <span className="text-xl" style={{ color: "#A8A29E" }}>
                  %
                </span>
              </div>
              <p className="text-xs mt-1.5" style={{ color: "#A8A29E" }}>
                {byStatus.offer ?? 0} offer
                {(byStatus.offer ?? 0) !== 1 ? "s" : ""} from {total}{" "}
                applications
              </p>
              <div
                className="h-0.5 rounded-full mt-4 overflow-hidden"
                style={{ background: "#EFEDE9" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(parseFloat(offerRate), 100)}%`,
                    background: "#2D6A4F",
                  }}
                />
              </div>
            </div>

            {/* Insight card */}
            <div
              className="rounded-2xl p-6"
              style={{ background: "#EFEDE9", border: "1px solid #E8E4DE" }}
            >
              <div className="flex items-center gap-1.5 mb-3">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="#57534E">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#57534E", fontSize: "0.6rem" }}
                >
                  Insight
                </span>
              </div>
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: "'Lora', serif",
                  fontSize: "0.87rem",
                  fontStyle: "italic",
                  color: "#57534E",
                  lineHeight: 1.7,
                }}
              >
                Applications sent on{" "}
                <strong
                  style={{
                    fontStyle: "normal",
                    fontWeight: 600,
                    color: "#1C1917",
                  }}
                >
                  Tuesdays
                </strong>{" "}
                get 20% more responses than those sent on Fridays.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
