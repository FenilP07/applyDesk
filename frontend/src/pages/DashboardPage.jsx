import React, { useEffect, useMemo } from "react";
import useJobStore from "../store/jobStore";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

// ─── CONFIGURATION ──────────────────────────────────────────────────────────

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
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

// ─── MOTION PRESETS ─────────────────────────────────────────────────────────

const easeOut = [0.16, 1, 0.3, 1];
const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: easeOut, delay } },
});

const stagger = {
  show: { transition: { staggerChildren: 0.06 } },
};

// ─── REUSABLE SUB-COMPONENTS ─────────────────────────────────────────────────

const Card = ({ children, className = "", delay = 0, noHover = false }) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={fadeUp(delay)}
      whileHover={reduce || noHover ? {} : { y: -3, scale: 1.01 }}
      className={`bg-white rounded-2xl border border-[#E8E4DE] ${className}`}
    >
      {children}
    </motion.div>
  );
};

function StatusPill({ status }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 border text-[0.62rem] font-semibold uppercase tracking-wider ${PILL_STYLES[status] || "bg-gray-100"}`}
    >
      {status}
    </motion.span>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { summary, fetchSummary, fetchJobs, jobs } = useJobStore();
  const reduce = useReducedMotion();

  useEffect(() => {
    fetchSummary();
    fetchJobs();
  }, [fetchSummary, fetchJobs]);

  const byStatus = summary?.byStatus ?? {};
  const total = summary?.total ?? 0;

  const maxVal = useMemo(() => Math.max(...FUNNEL.map((f) => byStatus[f.key] ?? 0), 1), [byStatus]);

  const stats = {
    conversion: total > 0 ? (((byStatus.interview ?? 0) / total) * 100).toFixed(1) : "0.0",
    offer: total > 0 ? (((byStatus.offer ?? 0) / total) * 100).toFixed(1) : "0.0",
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <motion.div 
      className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] px-6 py-10 lg:px-10"
      initial="hidden" animate="show" variants={stagger}
    >
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <motion.div className="mb-8" variants={fadeUp(0)}>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#A8A29E] mb-1">{today}</p>
          <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">Your Archive</h1>
          <p className="text-sm text-[#A8A29E] mt-1">Here's where everything stands today.</p>
        </motion.div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-[1px] bg-[#E8E4DE] border border-[#E8E4DE] rounded-2xl overflow-hidden mb-8">
          {STATUSES.map(({ key, label, dot }, idx) => (
            <motion.div 
              key={key} variants={fadeUp(idx * 0.02)}
              className="bg-white p-5 hover:bg-stone-50 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: dot }} />
                <span className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]">{label}</span>
              </div>
              <div className="text-3xl font-semibold font-['Lora'] tracking-tighter">
                {key === "total" ? total : (byStatus[key] ?? 0)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          
          <div className="flex flex-col gap-6">
            {/* Funnel Card */}
            <Card className="p-7">
              <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E] mb-6">Application Funnel</p>
              <div className="space-y-4 mb-6">
                {FUNNEL.map(({ key, label, fill }) => {
                  const val = byStatus[key] ?? 0;
                  const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <span className="text-sm font-medium w-16 text-[#57534E]">{label}</span>
                      <div className="flex-1 h-1.5 bg-[#EFEDE9] rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full rounded-full" style={{ background: fill }}
                          animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 100 }}
                        />
                      </div>
                      <span className="text-xs font-medium w-5 text-right text-[#A8A29E]">{val}</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Recent Section */}
            <Card className="p-7">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]">Recent Applications</p>
                <button className="text-xs font-medium text-[#A8A29E] hover:text-stone-900 transition-colors">View all →</button>
              </div>
              <div className="divide-y divide-[#EFEDE9]">
                {jobs?.slice(0, 4).map((job) => (
                  <div key={job.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <div className="text-sm font-medium text-stone-900">{job.title}</div>
                      <div className="text-xs text-[#A8A29E] mt-0.5">{job.company} {job.location && `· ${job.location}`}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill status={job.status} />
                      <span className="text-xs text-[#A8A29E]">
                        {job.dateApplied ? new Date(job.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            <SidebarStat label="Apply → Interview" value={stats.conversion} subtext="vs. 15% industry average" color="#1C1917" />
            <SidebarStat label="Offer Rate" value={stats.offer} subtext={`${byStatus.offer || 0} offers from ${total} apps`} color="#2D6A4F" />
            
            <Card className="p-6 bg-[#EFEDE9] border-[#E8E4DE]" noHover>
               <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[0.6rem] font-bold uppercase tracking-widest text-[#57534E]">✨ Insight</span>
               </div>
               <p className="text-sm italic font-['Lora'] leading-relaxed text-[#57534E]">
                  Applications sent on <strong className="text-[#1C1917] not-italic">Tuesdays</strong> get 20% more responses than those sent on Fridays.
               </p>
            </Card>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

// ─── HELPER COMPONENT (Internal to file) ────────────────────────────────────

function SidebarStat({ label, value, subtext, color }) {
  return (
    <Card className="p-6">
      <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E] mb-2">{label}</p>
      <div className="text-4xl font-semibold font-['Lora'] tracking-tighter">
        {value}<span className="text-xl text-[#A8A29E] ml-0.5">%</span>
      </div>
      <p className="text-xs text-[#A8A29E] mt-1.5">{subtext}</p>
      <div className="h-0.5 bg-[#EFEDE9] rounded-full mt-4 overflow-hidden">
        <motion.div 
          className="h-full rounded-full" style={{ background: color }}
          animate={{ width: `${Math.min(parseFloat(value), 100)}%` }}
        />
      </div>
    </Card>
  );
}