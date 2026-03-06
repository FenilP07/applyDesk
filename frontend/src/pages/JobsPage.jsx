import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useJobStore from "../store/jobStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  Star,
  ArrowLeft,
  MapPin,
  ChevronDown,
  SlidersHorizontal,
  X,
  Check,
  Archive,
  MessageSquare,
  NotebookPen,
  Link2,
  SquareArrowOutUpRight,
} from "lucide-react";
import { jobApi } from "../api/jobApi";
import JobModal from "../modals/JobModal";
import LinkModal from "../modals/LinkModal";
import JobDetailPanel from "../modals/JobDetailPanel";
import { useJobNotesStore } from "../store/jobNoteStore";

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
const MAX_TAGS_IN_TABLE = 3;

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

function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );

  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return w;
}

function TagPills({ tags = [] }) {
  const safe = Array.isArray(tags) ? tags.filter(Boolean) : [];
  const shown = safe.slice(0, MAX_TAGS_IN_TABLE);
  const extra = safe.length - shown.length;

  if (!shown.length) return null;

  return (
    <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
      {shown.map((t) => (
        <span
          key={t}
          title={t}
          className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-[0.6rem] font-semibold whitespace-nowrap"
        >
          {t}
        </span>
      ))}
      {extra > 0 && (
        <span className="px-2 py-0.5 rounded-full bg-transparent border border-stone-200 text-stone-400 text-[0.6rem] font-semibold whitespace-nowrap">
          +{extra}
        </span>
      )}
    </div>
  );
}

function formatAppliedDate(date) {
  if (!date) return "—";

  const now = new Date();
  const applied = new Date(date);

  const diffTime = now - applied;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return applied.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

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
    page,
    limit,
    total,
    hasMore,
    nextPage,
    prevPage,
    setLimit,
  } = useJobStore();

  const { byJobId } = useJobNotesStore();

  const [modal, setModal] = useState({ open: false, job: null });
  const [detailJob, setDetailJob] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [linkJob, setLinkJob] = useState(null);

  const navigate = useNavigate();
  const w = useWindowWidth();
  const isMobile = w < 768;
  const desiredLimit = isMobile ? 6 : 9;

  useEffect(() => {
    if (limit !== desiredLimit) {
      setLimit(desiredLimit);
    }
  }, [desiredLimit, limit, setLimit]);

  useEffect(() => {
    fetchJobs({ mode: "replace" });
  }, [
    filters.status,
    filters.q,
    filters.priority,
    filters.starred,
    filters.archived,
    page,
    limit,
    fetchJobs,
  ]);

  useEffect(() => {
    setDetailJob(null);
  }, [page]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        setDetailJob(null);
        setConfirmDelete(null);
        setLinkJob(null);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleDelete = async (id) => {
    await deleteJob(id);
    setConfirmDelete(null);
    if (detailJob?.id === id) setDetailJob(null);
  };

  const openEdit = (job) => {
    setDetailJob(null);
    setTimeout(() => setModal({ open: true, job }), 80);
  };

  const handleSaveLink = async (cleaned) => {
    if (!linkJob?.id) {
      return { success: false, message: "No job selected." };
    }

    try {
      await jobApi.update(linkJob.id, { link: cleaned });
      await fetchJobs({ mode: "replace" });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || "Failed to save link.",
      };
    }
  };

  const activeFilterCount = [
    filters.priority !== "all",
    filters.starred,
    filters.archived,
  ].filter(Boolean).length;

  return (
    <div
      className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] transition-all duration-300"
      style={{ paddingRight: !isMobile && detailJob ? 420 : 0 }}
    >
      <div className="px-4 py-8 md:px-6 md:py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">
                Applications
              </h1>
              <p className="text-sm text-[#A8A29E] mt-1">
                {loading
                  ? "Loading…"
                  : `${total} opportunit${total === 1 ? "y" : "ies"} tracked`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 md:ml-auto w-full md:w-auto">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E4DE] bg-white text-sm font-medium text-stone-600 hover:bg-stone-50 transition-all w-full sm:w-auto"
              >
                <ArrowLeft size={14} />
                Dashboard
              </button>

              <button
                onClick={() => setModal({ open: true, job: null })}
                className="flex items-center justify-center gap-2 bg-[#1C1917] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black transition-all active:scale-95 shadow-sm w-full sm:w-auto"
              >
                <Plus size={15} />
                Add Application
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
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

            <div className="flex gap-3 sm:w-auto">
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all ${
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
            <div className="overflow-x-auto">
              <div className="min-w-[900px]">
                {/* Column headers */}
                <div className="grid grid-cols-[1.8fr_1fr_100px_140px_100px_132px] px-5 py-3.5 bg-[#FBF9F7] border-b border-[#E8E4DE]">
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
                        const noteCount = byJobId?.[job.id]?.items?.length || 0;
                        const hasNotes = noteCount > 0;

                        const ICON_BTN =
                          "w-7 h-7 flex items-center justify-center rounded-lg text-stone-300 hover:text-stone-800 hover:bg-stone-100 transition-all";

                        return (
                          <motion.div
                            key={job.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.99 }}
                            onClick={() =>
                              setDetailJob((p) =>
                                p?.id === job.id ? null : job,
                              )
                            }
                            className={`grid grid-cols-[1.8fr_1fr_100px_140px_100px_132px] px-5 py-3.5 items-center cursor-pointer transition-colors group ${
                              isSelected
                                ? "bg-stone-50 border-l-2 border-l-stone-800 -ml-px"
                                : "hover:bg-[#FAFAF9] border-l-2 border-l-transparent"
                            }`}
                          >
                            {/* Opportunity */}
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              {/* <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleStarred(job.id);
                                }}
                                className={`flex-shrink-0 transition-colors ${
                                  job.starred
                                    ? "text-amber-400"
                                    : "text-stone-200 hover:text-amber-300"
                                }`}
                              >
                                <Star
                                  size={13}
                                  fill={job.starred ? "currentColor" : "none"}
                                />
                              </button> */}

                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-stone-900 truncate">
                                  {job.title}
                                </p>

                                <div className="flex items-center gap-2 min-w-0 mt-[2px]">
                                  <p className="text-[0.68rem] text-stone-400 truncate">
                                    {job.company}
                                  </p>
                                  <TagPills tags={job.tags} />
                                </div>
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

                            {/* Status */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <StatusDrop job={job} />
                            </div>

                            {/* Date */}
                            <div className="text-xs text-stone-400">
                              {formatAppliedDate(job.dateApplied)}
                            </div>

                            {/* Actions */}
                            <div
                              className="flex justify-end items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => setDetailJob(job)}
                                title={hasNotes ? "View notes" : "Add note"}
                                className={ICON_BTN}
                              >
                                {hasNotes ? (
                                  <MessageSquare size={14} />
                                ) : (
                                  <NotebookPen size={14} />
                                )}
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); 

                                  if (job.link) {
                                   
                                    const url = job.link.startsWith("http")
                                      ? job.link
                                      : `https://${job.link}`;
                                    window.open(
                                      url,
                                      "_blank",
                                      "noopener,noreferrer",
                                    );
                                  } else {
                                    
                                    setLinkJob(job);
                                  }
                                }}
                                title={
                                  job.link
                                    ? "Open Application Link"
                                    : "Add Link"
                                }
                                className={ICON_BTN}
                              >
                                {job.link ? (
                                  <SquareArrowOutUpRight size={14} />
                                ) : (
                                  <Link2 size={14} />
                                )}
                              </button>

                              <button
                                onClick={() => openEdit(job)}
                                title="Edit"
                                className={ICON_BTN}
                              >
                                <Pencil size={14} />
                              </button>

                              <button
                                onClick={() => setConfirmDelete(job.id)}
                                title="Delete"
                                className={`${ICON_BTN} hover:bg-rose-50 hover:text-rose-500`}
                              >
                                <Trash2 size={14} />
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

          {/* Pagination */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-4">
            <p className="text-xs text-stone-400">
              Showing{" "}
              <span className="font-semibold text-stone-700">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>
              {"–"}
              <span className="font-semibold text-stone-700">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-semibold text-stone-700">{total}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={loading || page <= 1}
                onClick={prevPage}
                className="px-3 py-2 rounded-xl border border-[#E8E4DE] bg-white text-sm text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
              >
                Prev
              </button>

              <span className="text-sm text-stone-500 px-2">
                Page{" "}
                <span className="font-semibold text-stone-800">{page}</span>
              </span>

              <button
                disabled={loading || !hasMore}
                onClick={nextPage}
                className="px-3 py-2 rounded-xl border border-[#E8E4DE] bg-white text-sm text-stone-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-50 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {detailJob && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30"
              onClick={() => setDetailJob(null)}
            />

            <JobDetailPanel
              job={detailJob}
              onClose={() => setDetailJob(null)}
              onEdit={openEdit}
            />
          </>
        )}
      </AnimatePresence>

      {/* Job modal */}
      <JobModal
        open={modal.open}
        job={modal.job}
        onClose={() => setModal({ open: false, job: null })}
      />

      {/* Link modal */}
      <LinkModal
        open={!!linkJob}
        initialValue={linkJob?.link || ""}
        onClose={() => setLinkJob(null)}
        onSave={handleSaveLink}
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
