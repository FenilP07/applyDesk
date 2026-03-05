import { useEffect, useState } from "react";
import useJobStore from "../store/jobStore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Plus, Trash2, Pencil, Link2, 
  ExternalLink, MapPin, Filter 
} from "lucide-react";
import JobModal from "../modals/JobModal";

const TABLE_GRID = "grid grid-cols-[1.5fr_1fr_1fr_1fr_100px] px-6";

// EXACT SAME PILL STYLES FROM YOUR DASHBOARD
const PILL_STYLES = {
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

export default function JobsPage() {
  const { jobs, loading, filters, setFilter, fetchJobs, deleteJob } = useJobStore();
  const [modal, setModal] = useState({ open: false, job: null });

  useEffect(() => {
    fetchJobs();
  }, [filters.status, filters.q]);

  return (
    <div className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        
        {/* SaaS Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">Applications</h1>
            <p className="text-sm text-[#A8A29E] mt-1">Manage and track your active opportunities.</p>
          </div>
          <button
            onClick={() => setModal({ open: true, job: null })}
            className="flex items-center gap-2 bg-[#1C1917] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-all active:scale-95 shadow-sm"
          >
            <Plus size={16} /> Add Application
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1 group">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
            <input
              placeholder="Search by company or role..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white border border-[#E8E4DE] outline-none text-sm focus:ring-2 focus:ring-stone-200 transition-all"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none cursor-pointer hover:bg-stone-50 transition-colors"
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {/* Table Wrapper */}
        <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
          <div className={`${TABLE_GRID} py-4 bg-[#FBF9F7] border-b border-[#E8E4DE] hidden md:grid`}>
            {["Opportunity", "Location", "Status", "Date", ""].map(h => (
              <span key={h} className="text-[0.62rem] font-bold uppercase tracking-widest text-[#A8A29E]">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-[#EFEDE9]">
            <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="py-20 text-center text-sm text-stone-400 animate-pulse">Loading archive...</div>
              ) : (
                jobs.map((job) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    key={job.id}
                    className={`${TABLE_GRID} py-4 items-center hover:bg-stone-50/50 transition-colors group`}
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-semibold text-stone-900 truncate">{job.title}</span>
                      <span className="text-[0.7rem] text-stone-400 truncate">{job.company}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500">
                      <MapPin size={12} className="text-stone-300" />
                      <span className="truncate">{job.location || "Remote"}</span>
                    </div>

                    <div>
                      <span className={`px-2.5 py-0.5 rounded-full border text-[0.62rem] font-bold uppercase tracking-wider ${PILL_STYLES[job.status]}`}>
                        {job.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-400 font-medium">
                      {new Date(job.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>

                    <div className="flex justify-end gap-1 md:opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setModal({ open: true, job })} className="p-1.5 hover:bg-white hover:border-stone-200 border border-transparent rounded-lg text-stone-400 hover:text-stone-900 transition-all">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => job.link && window.open(job.link, "_blank")} className="p-1.5 hover:bg-white hover:border-stone-200 border border-transparent rounded-lg text-stone-400 hover:text-stone-900 transition-all">
                        <ExternalLink size={14} />
                      </button>
                      <button onClick={() => deleteJob(job.id)} className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-stone-300 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <JobModal open={modal.open} job={modal.job} onClose={() => setModal({ open: false, job: null })} />
    </div>
  );
}