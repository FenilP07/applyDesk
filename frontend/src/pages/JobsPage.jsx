import { useEffect, useState } from "react";
import useJobStore from "../store/jobStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Star,
  ExternalLink,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  X,
  Check,
  Archive,
} from "lucide-react";
import JobModal from "../modals/JobModal";
import JobDetailPanel from "../modals/JobDetailPanel";

// ─── SHARED TOKENS ────────────────────────────────────────────────────────────

const PILL_STYLES = {
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

const PRIORITY_DOT = {
  low: "bg-stone-300",
  medium: "bg-amber-400",
  high: "bg-rose-400",
};

const STATUSES = ["applied", "interview", "offer", "rejected"];

// ─── INLINE STATUS DROPDOWN ───────────────────────────────────────────────────

function StatusDrop({ job }) {
  const { statusUpdate } = useJobStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handle = async (s) => {
    setOpen(false);
    if (s === job.status) return;
    setBusy(true);
    await statusUpdate(job.id, s);
    setBusy(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-wider transition-all ${PILL_STYLES[job.status]} hover:opacity-75`}
      >
        {busy && (
          <span className="w-2.5 h-2.5 rounded-full border border-current/30 border-t-current animate-spin" />
        )}
        {job.status}
        <ChevronDown size={9} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full left-0 mt-1.5 bg-white border border-[#E8E4DE] rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]"
            >
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => handle(s)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium capitalize flex items-center gap-2 transition-colors hover:bg-stone-50 ${
                    s === job.status
                      ? "bg-stone-50 text-stone-900 font-semibold"
                      : "text-stone-500"
                  }`}
                >
                  {s === job.status ? (
                    <Check size={10} className="text-stone-400" />
                  ) : (
                    <span className="w-[10px]" />
                  )}
                  {s}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const {
    jobs,
    loading,
    filters,
    setFilter,
    fetchJobs,
    deleteJob,
    toggleStarred,
    resetFilters,
  } = useJobStore();
  const [modal, setModal] = useState({ open: false, job: null });
  const [detailJob, setDetailJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [
    filters.status,
    filters.q,
    filters.priority,
    filters.starred,
    filters.archived,
  ]);

  const handleDelete = async (id) => {
    await deleteJob(id);
    setConfirmDelete(null);
    if (detailJob?.id === id) setDetailJob(null);
  };

  const openEdit = (job) => {
    setDetailJob(null);
    setTimeout(() => setModal({ open: true, job }), 80);
  };

  const activeFilterCount = [
    filters.priority !== "all",
    filters.starred,
    filters.archived,
  ].filter(Boolean).length;

  return (
    <div
      className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] transition-all duration-300"
      style={{ paddingRight: detailJob ? 420 : 0 }}
    >
      <div className="px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">
                Applications
              </h1>
              <p className="text-sm text-[#A8A29E] mt-1">
                {loading
                  ? "Loading…"
                  : `${jobs.length} opportunit${jobs.length === 1 ? "y" : "ies"} tracked`}
              </p>
            </div>
            <button
              onClick={() => setModal({ open: true, job: null })}
              className="flex items-center gap-2 bg-[#1C1917] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-all active:scale-95 shadow-sm"
            >
              <Plus size={15} /> Add Application
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex gap-3 mb-4 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] group">
              <Search
                size={13}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-500 transition-colors"
              />
              <input
                placeholder="Search role or company…"
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
              />
              {filters.q && (
                <button
                  onClick={() => setFilter("q", "")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Status */}
            <select
              value={filters.status}
              onChange={(e) => setFilter("status", e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <option value="all">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>

            {/* More filters */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                showFilters || activeFilterCount > 0
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white border-[#E8E4DE] text-stone-500 hover:bg-stone-50"
              }`}
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/25 text-white text-[0.58rem] font-bold rounded-full px-1.5 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Extended filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 mb-4 flex flex-wrap gap-5 items-end">
                  <div>
                    <label className="block text-[0.6rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">
                      Priority
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilter("priority", e.target.value)}
                      className="px-3 py-2 rounded-xl bg-[#F7F5F2] border border-[#E8E4DE] text-sm outline-none cursor-pointer"
                    >
                      <option value="all">All</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4">
                    {[
                      {
                        key: "starred",
                        label: "Starred only",
                        icon: (
                          <Star
                            size={11}
                            className="text-amber-400"
                            fill={filters.starred ? "currentColor" : "none"}
                          />
                        ),
                      },
                      {
                        key: "archived",
                        label: "Show archived",
                        icon: <Archive size={11} />,
                      },
                    ].map(({ key, label, icon }) => (
                      <label
                        key={key}
                        className="flex items-center gap-2 cursor-pointer select-none"
                      >
                        <div
                          onClick={() => setFilter(key, !filters[key])}
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all cursor-pointer ${
                            filters[key]
                              ? "bg-stone-900 border-stone-900"
                              : "bg-white border-stone-300 hover:border-stone-400"
                          }`}
                        >
                          {filters[key] && (
                            <Check size={10} className="text-white" />
                          )}
                        </div>
                        <span className="text-sm text-stone-600 flex items-center gap-1.5">
                          {icon}
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      resetFilters();
                      setShowFilters(false);
                    }}
                    className="ml-auto text-xs text-[#A8A29E] hover:text-stone-700 underline underline-offset-2 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[1.8fr_1fr_100px_140px_100px_80px] px-5 py-3.5 bg-[#FBF9F7] border-b border-[#E8E4DE] hidden md:grid">
              {[
                "Opportunity",
                "Location",
                "Priority",
                "Status",
                "Applied",
                "",
              ].map((h) => (
                <span
                  key={h}
                  className="text-[0.58rem] font-bold uppercase tracking-widest text-[#A8A29E]"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-[#F5F3F0]">
              <AnimatePresence mode="popLayout">
                {loading && !jobs.length ? (
                  <div className="py-20 text-center text-sm text-stone-300 animate-pulse">
                    Loading…
                  </div>
                ) : !jobs.length ? (
                  <div className="py-16 text-center">
                    <p className="text-stone-300 text-sm mb-3">
                      No applications found
                    </p>
                    <button
                      onClick={() => setModal({ open: true, job: null })}
                      className="text-xs font-medium text-stone-500 hover:text-stone-900 underline underline-offset-2"
                    >
                      Add your first application →
                    </button>
                  </div>
                ) : (
                  jobs.map((job) => {
                    const isSelected = detailJob?.id === job.id;
                    return (
                      <motion.div
                        key={job.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.99 }}
                        onClick={() =>
                          setDetailJob((p) => (p?.id === job.id ? null : job))
                        }
                        className={`grid grid-cols-[1.8fr_1fr_100px_140px_100px_80px] px-5 py-3.5 items-center cursor-pointer transition-colors group ${
                          isSelected
                            ? "bg-stone-50 border-l-2 border-l-stone-800 -ml-px"
                            : "hover:bg-[#FAFAF9] border-l-2 border-l-transparent"
                        }`}
                      >
                        {/* Opportunity */}
                        <div className="flex items-center gap-2.5 min-w-0 pr-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarred(job.id);
                            }}
                            className={`flex-shrink-0 transition-colors ${job.starred ? "text-amber-400" : "text-stone-200 hover:text-amber-300"}`}
                          >
                            <Star
                              size={13}
                              fill={job.starred ? "currentColor" : "none"}
                            />
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 truncate">
                              {job.title}
                            </p>
                            <p className="text-[0.68rem] text-stone-400 truncate">
                              {job.company}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-stone-400 truncate">
                          <MapPin
                            size={11}
                            className="text-stone-300 flex-shrink-0"
                          />
                          <span className="truncate">
                            {job.location || "—"}
                          </span>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center gap-1.5">
                          {job.priority && (
                            <>
                              <div
                                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[job.priority]}`}
                              />
                              <span className="text-xs text-stone-500 capitalize">
                                {job.priority}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Status - inline drop */}
                        <div onClick={(e) => e.stopPropagation()}>
                          <StatusDrop job={job} />
                        </div>

                        {/* Date */}
                        <div className="text-xs text-stone-400">
                          {job.dateApplied
                            ? new Date(job.dateApplied).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )
                            : "—"}
                        </div>

                        {/* Actions */}
                        <div
                          className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => openEdit(job)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-all"
                          >
                            <Pencil size={13} />
                          </button>
                          {job.link && (
                            <a
                              href={job.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-700 hover:bg-stone-100 transition-all"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => setConfirmDelete(job.id)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detailJob && (
          <JobDetailPanel
            job={detailJob}
            onClose={() => setDetailJob(null)}
            onEdit={openEdit}
          />
        )}
      </AnimatePresence>

      {/* Job modal */}
      <JobModal
        open={modal.open}
        job={modal.job}
        onClose={() => setModal({ open: false, job: null })}
      />

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96 }}
              className="bg-white rounded-2xl border border-[#E8E4DE] shadow-xl p-7 max-w-sm w-full"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <h3 className="font-semibold font-['Lora'] text-stone-900 text-lg mb-2">
                Delete application?
              </h3>
              <p className="text-sm text-stone-500 leading-relaxed mb-6">
                This will permanently remove the application and all its notes.
                This cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 border border-[#E8E4DE] rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 bg-rose-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-rose-700 transition-all active:scale-[0.98]"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
