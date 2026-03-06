import React, { useEffect, useMemo } from "react";
import useJobStore from "../store/jobStore";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Star, ArrowRight, TrendingUp } from "lucide-react";

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const STAT_STRIP = [
  { key: "total", label: "Total", dot: "#A8A29E" },
  { key: "applied", label: "Applied", dot: "#1D4ED8" },
  { key: "interview", label: "Interviews", dot: "#B45309" },
  { key: "offer", label: "Offers", dot: "#2D6A4F" },
  { key: "rejected", label: "Rejected", dot: "#BE123C" },
];

const FUNNEL = [
  { key: "applied", label: "Applied", fill: "#BFDBFE", track: "#EFF6FF" },
  { key: "interview", label: "Interview", fill: "#FCD34D", track: "#FEF3C7" },
  { key: "offer", label: "Offer", fill: "#6EE7B7", track: "#ECFDF5" },
  { key: "rejected", label: "Rejected", fill: "#FDA4AF", track: "#FFF1F2" },
];

const PILL_STYLES = {
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

// ─── MOTION PRESETS ───────────────────────────────────────────────────────────

const ease = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease, delay } },
});
const stagger = { show: { transition: { staggerChildren: 0.06 } } };

// ─── CARD ─────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = "",
  delay = 0,
  noHover = false,
  onClick,
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={fadeUp(delay)}
      whileHover={reduce || noHover ? {} : { y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-2xl border border-[#E8E4DE] ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {children}
    </motion.div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-5">
      {children}
    </p>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { summary, fetchSummary, fetchJobs, jobs } = useJobStore();
  const reduce = useReducedMotion();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSummary();
    fetchJobs();
  }, [fetchSummary, fetchJobs]);

  const byStatus = summary?.byStatus ?? {};
  const total = summary?.total ?? 0;

  const maxFunnel = useMemo(
    () => Math.max(...FUNNEL.map((f) => byStatus[f.key] ?? 0), 1),
    [byStatus],
  );

  const convRate =
    total > 0 ? (((byStatus.interview ?? 0) / total) * 100).toFixed(1) : "0.0";
  const offerRate =
    total > 0 ? (((byStatus.offer ?? 0) / total) * 100).toFixed(1) : "0.0";

  const recentJobs = jobs?.slice(0, 3) ?? [];
  const starredJobs = jobs?.filter((j) => j.starred).slice(0, 3) ?? [];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <motion.div
      className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] px-6 py-10 lg:px-10"
      initial="hidden"
      animate="show"
      variants={stagger}
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <motion.div className="mb-8" variants={fadeUp(0)}>
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#A8A29E] mb-1">
            {today}
          </p>
          <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">
            Your Archive
          </h1>
          <p className="text-sm text-[#A8A29E] mt-1">
            Here's where everything stands today.
          </p>
        </motion.div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-[#E8E4DE] border border-[#E8E4DE] rounded-2xl overflow-hidden mb-8">
          {STAT_STRIP.map(({ key, label, dot }, idx) => (
            <motion.div
              key={key}
              variants={fadeUp(idx * 0.03)}
              className="bg-white p-5 hover:bg-[#FAFAF9] transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: dot }}
                />
                <span className="text-[0.58rem] font-bold uppercase tracking-widest text-[#A8A29E]">
                  {label}
                </span>
              </div>
              <div className="text-3xl font-semibold font-['Lora'] tracking-tighter text-stone-900">
                {key === "total" ? total : (byStatus[key] ?? 0)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Left */}
          <div className="flex flex-col gap-6">
            {/* Funnel */}
            <Card className="p-7">
              <div className="flex items-center justify-between mb-5">
                <SectionLabel>Application Funnel</SectionLabel>
                <TrendingUp size={13} className="text-stone-300 -mt-4" />
              </div>
              <div className="space-y-4">
                {FUNNEL.map(({ key, label, fill, track }) => {
                  const val = byStatus[key] ?? 0;
                  const pct = (val / maxFunnel) * 100;
                  const ofTotal =
                    total > 0 ? ((val / total) * 100).toFixed(0) : 0;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <span className="text-sm font-medium text-[#57534E] w-16 flex-shrink-0">
                        {label}
                      </span>
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: track }}
                      >
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: fill }}
                          animate={{ width: `${pct}%` }}
                          transition={{
                            type: "spring",
                            stiffness: 80,
                            damping: 20,
                          }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-stone-600 w-5 text-right flex-shrink-0">
                        {val}
                      </span>
                      <span className="text-[0.65rem] text-[#A8A29E] w-7 text-right flex-shrink-0">
                        {ofTotal}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent */}
            <Card className="p-7">
              <div className="flex justify-between items-center mb-5">
                <SectionLabel>Recent Applications</SectionLabel>
                <button onClick={()=>navigate("/jobs")}
                className="text-xs font-medium text-[#A8A29E] hover:text-stone-700 transition-colors flex items-center gap-1 -mt-4">
                  View all <ArrowRight size={11} />
                </button>
              </div>
              {recentJobs.length === 0 ? (
                <p className="text-sm text-stone-300 text-center py-6">
                  No applications yet
                </p>
              ) : (
                <div className="divide-y divide-[#EFEDE9]">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="py-3.5 flex justify-between items-center gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-stone-900 truncate flex items-center gap-1.5">
                          {job.starred && (
                            <Star
                              size={11}
                              fill="currentColor"
                              className="text-amber-400 flex-shrink-0"
                            />
                          )}
                          {job.title}
                        </p>
                        <p className="text-xs text-[#A8A29E] mt-0.5 truncate">
                          {job.company}
                          {job.location ? ` · ${job.location}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-wider ${PILL_STYLES[job.status]}`}
                        >
                          {job.status}
                        </span>
                        <span className="text-xs text-[#A8A29E]">
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
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">
            {/* Rate cards */}
            {[
              {
                label: "Apply → Interview",
                value: convRate,
                sub: "vs. 15% industry avg",
                color: "#1C1917",
              },
              {
                label: "Offer Rate",
                value: offerRate,
                sub: `${byStatus.offer || 0} offers · ${total} apps`,
                color: "#2D6A4F",
              },
            ].map(({ label, value, sub, color }) => (
              <Card key={label} className="p-6">
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-2">
                  {label}
                </p>
                <div className="text-4xl font-semibold font-['Lora'] tracking-tighter">
                  {value}
                  <span className="text-xl text-[#A8A29E] ml-0.5">%</span>
                </div>
                <p className="text-xs text-[#A8A29E] mt-1.5">{sub}</p>
                <div className="h-1 bg-[#EFEDE9] rounded-full mt-4 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: color }}
                    animate={
                      reduce
                        ? {}
                        : { width: `${Math.min(parseFloat(value), 100)}%` }
                    }
                    transition={{ type: "spring", stiffness: 80 }}
                  />
                </div>
              </Card>
            ))}

            {/* Starred */}
            {starredJobs.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-1.5 mb-4">
                  <Star
                    size={12}
                    fill="currentColor"
                    className="text-amber-400"
                  />
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[#A8A29E]">
                    Starred
                  </p>
                </div>
                <div className="space-y-3">
                  {starredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex justify-between items-center gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-800 truncate">
                          {job.title}
                        </p>
                        <p className="text-[0.68rem] text-[#A8A29E]">
                          {job.company}
                        </p>
                      </div>
                      <span
                        className={`flex-shrink-0 px-2 py-0.5 rounded-full border text-[0.58rem] font-bold uppercase tracking-wider ${PILL_STYLES[job.status]}`}
                      >
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Insight */}
            <Card className="p-6 bg-[#EFEDE9] border-[#E8E4DE]" noHover>
              <span className="text-[0.58rem] font-bold uppercase tracking-widest text-[#57534E]">
                ✨ Insight
              </span>
              <p className="text-sm italic font-['Lora'] leading-relaxed text-[#57534E] mt-2">
                Applications sent on{" "}
                <strong className="text-[#1C1917] not-italic">Tuesdays</strong>{" "}
                get 20% more responses than those sent on Fridays.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
