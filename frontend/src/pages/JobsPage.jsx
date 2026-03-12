import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import useJobStore from "../store/jobStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
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
  ArrowLeft,
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
const MAX_TAGS_IN_TABLE = 2; // Reduced for better spacing

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
          className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600 text-[0.65rem] font-semibold whitespace-nowrap truncate"
        >
          {t}
        </span>
      ))}
      {extra > 0 && (
        <span className="text-stone-400 text-[0.65rem] font-semibold">
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return applied.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function StatusDrop({ job }) {
  const { statusUpdate } = useJobStore();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 160 });
  const btnRef = useRef(null);

  const updateMenuPos = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 8,
      left: Math.min(rect.left, window.innerWidth - 170), // Keep on screen
      width: Math.max(rect.width, 140),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPos();
    window.addEventListener("scroll", updateMenuPos, true);
    window.addEventListener("resize", updateMenuPos);
    return () => {
      window.removeEventListener("scroll", updateMenuPos, true);
      window.removeEventListener("resize", updateMenuPos);
    };
  }, [open]);

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
        ref={btnRef}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[0.65rem] md:text-[0.72rem] font-bold uppercase tracking-wider transition-all ${PILL_STYLES[job.status]} hover:opacity-80`}
      >
        {busy && (
          <span className="w-2.5 h-2.5 rounded-full border border-current/30 border-t-current animate-spin" />
        )}
        {job.status}
        <ChevronDown size={10} />
      </button>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-140"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  className="fixed bg-white border border-[#E8E4DE] rounded-xl shadow-xl z-150 overflow-hidden"
                  style={{
                    top: menuPos.top,
                    left: menuPos.left,
                    minWidth: menuPos.width,
                  }}
                >
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => handle(s)}
                      className={`w-full text-left px-3.5 py-2.5 text-[0.72rem] font-medium capitalize flex items-center gap-2 hover:bg-stone-50 ${s === job.status ? "bg-stone-50 text-stone-900 font-semibold" : "text-stone-500"}`}
                    >
                      {s === job.status ? (
                        <Check size={10} />
                      ) : (
                        <span className="w-2.5" />
                      )}
                      {s}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}

export default function JobsPage() {
  const {
    jobs,
    loading,
    filters,
    setFilter,
    fetchJobs,
    deleteJob,
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
  const desiredLimit = isMobile ? 8 : 10;

  useEffect(() => {
    if (limit !== desiredLimit) setLimit(desiredLimit);
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
  const ACTION_BTN =
    "w-9 h-9 md:w-7 md:h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-all border border-transparent md:border-none";

  return (
    <div
      className="min-h-screen bg-[#F7F5F2] font-['DM_Sans'] transition-all duration-300"
      style={{ paddingRight: !isMobile && detailJob ? 420 : 0 }}
    >
      <div className="px-4 py-6 md:px-6 md:py-10 lg:px-10">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">
                Applications
              </h1>
              <p className="text-xs md:text-sm text-[#A8A29E] mt-1">
                {loading
                  ? "Loading…"
                  : `${total} opportunit${total === 1 ? "y" : "ies"} tracked`}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#E8E4DE] bg-white text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                <ArrowLeft size={14} /> Dashboard
              </button>
              <button
                onClick={() => setModal({ open: true, job: null })}
                className="flex-[1.5] md:flex-none flex items-center justify-center gap-2 bg-[#1C1917] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-black shadow-sm active:scale-95 transition-all"
              >
                <Plus size={15} /> Add Application
              </button>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1 group">
              <Search
                size={13}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-300 group-focus-within:text-stone-500"
              />
              <input
                placeholder="Search role or company…"
                value={filters.q}
                onChange={(e) => setFilter("q", e.target.value)}
                className="w-full pl-10 pr-8 py-3 md:py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none focus:ring-2 focus:ring-stone-200 transition-all"
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

            <div className="flex gap-2">
              <select
                value={filters.status}
                onChange={(e) => setFilter("status", e.target.value)}
                className="flex-1 md:w-40 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4DE] text-sm outline-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters || activeFilterCount > 0 ? "bg-stone-900 text-white border-stone-900" : "bg-white border-[#E8E4DE] text-stone-500 hover:bg-stone-50"}`}
              >
                <SlidersHorizontal size={13} />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-white/25 text-white text-[0.6rem] font-bold rounded-full px-1.5 py-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Extended Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-[#E8E4DE] rounded-2xl p-4 mb-4 flex flex-wrap gap-4 items-end">
                  <div className="w-full sm:w-auto">
                    <label className="block text-[0.65rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">
                      Priority
                    </label>
                    <select
                      value={filters.priority}
                      onChange={(e) => setFilter("priority", e.target.value)}
                      className="w-full sm:w-32 px-3 py-2 rounded-xl bg-[#F7F5F2] border border-[#E8E4DE] text-sm outline-none"
                    >
                      <option value="all">All</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none py-2">
                    <div
                      onClick={() => setFilter("archived", !filters.archived)}
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${filters.archived ? "bg-stone-900 border-stone-900" : "bg-white border-stone-300"}`}
                    >
                      {filters.archived && (
                        <Check size={10} className="text-white" />
                      )}
                    </div>
                    <span className="text-sm text-stone-600 flex items-center gap-1.5">
                      <Archive size={11} /> Show archived
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      resetFilters();
                      setShowFilters(false);
                    }}
                    className="ml-auto text-xs text-[#A8A29E] hover:text-stone-700 underline underline-offset-2"
                  >
                    Clear all
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content Area: Responsive Switch */}
          <div className="bg-white md:rounded-2xl border border-[#E8E4DE] shadow-sm overflow-hidden">
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <div className="min-w-225">
                <div className="grid grid-cols-[1.8fr_1fr_100px_140px_100px_132px] px-5 py-4 bg-[#FBF9F7] border-b border-[#E8E4DE]">
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
                <div className="divide-y divide-[#F5F3F0]">
                  {loading && !jobs.length ? (
                    <div className="py-20 text-center text-sm text-stone-300 animate-pulse">
                      Loading…
                    </div>
                  ) : !jobs.length ? (
                    <div className="py-16 text-center text-stone-300 text-sm">
                      No applications found
                    </div>
                  ) : (
                    jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() =>
                          setDetailJob((p) => (p?.id === job.id ? null : job))
                        }
                        className={`grid grid-cols-[1.8fr_1fr_100px_140px_100px_132px] px-5 py-4 items-center cursor-pointer transition-colors group ${detailJob?.id === job.id ? "bg-stone-50 border-l-2 border-l-stone-800 -ml-px" : "hover:bg-[#FAFAF9] border-l-2 border-l-transparent"}`}
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-semibold text-stone-900 truncate">
                            {job.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[0.68rem] text-stone-400 truncate">
                              {job.company}
                            </p>
                            <TagPills tags={job.tags} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-stone-400 truncate">
                          <MapPin size={11} className="shrink-0" />{" "}
                          {job.location || "—"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[job.priority]}`}
                          />
                          <span className="text-xs text-stone-500 capitalize">
                            {job.priority}
                          </span>
                        </div>
                        <StatusDrop job={job} />
                        <div className="text-xs text-stone-400">
                          {formatAppliedDate(job.dateApplied)}
                        </div>
                        <div
                          className="flex justify-end gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setDetailJob(job)}
                            className={ACTION_BTN}
                          >
                            {byJobId?.[job.id]?.items?.length > 0 ? (
                              <MessageSquare size={14} />
                            ) : (
                              <NotebookPen size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              if (job.link)
                                window.open(
                                  job.link.startsWith("http")
                                    ? job.link
                                    : `https://${job.link}`,
                                  "_blank",
                                );
                              else setLinkJob(job);
                            }}
                            className={ACTION_BTN}
                          >
                            {job.link ? (
                              <SquareArrowOutUpRight size={14} />
                            ) : (
                              <Link2 size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => openEdit(job)}
                            className={ACTION_BTN}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(job.id)}
                            className={`${ACTION_BTN} hover:text-rose-500`}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden divide-y divide-stone-100">
              {loading && !jobs.length ? (
                <div className="py-20 text-center text-sm text-stone-300">
                  Loading…
                </div>
              ) : !jobs.length ? (
                <div className="py-16 text-center text-stone-300 text-sm">
                  No applications found
                </div>
              ) : (
                jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => setDetailJob(job)}
                    className="p-4 active:bg-stone-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-stone-900 truncate leading-snug">
                          {job.title}
                        </h3>
                        <p className="text-xs text-stone-500 font-medium truncate mt-0.5">
                          {job.company}
                        </p>
                      </div>
                      <StatusDrop job={job} />
                    </div>

                    <div className="flex flex-wrap items-center gap-y-2 gap-x-3 mt-3">
                      <div className="flex items-center gap-1 text-[0.65rem] text-stone-400 bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                        <MapPin size={10} /> {job.location || "Remote"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[0.65rem] text-stone-400">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[job.priority]}`}
                        />
                        <span className="capitalize">{job.priority}</span>
                      </div>
                      <div className="text-[0.65rem] text-stone-500 bg-stone-100/50 px-2 py-0.5 rounded ml-auto">
                        Applied {formatAppliedDate(job.dateApplied)}
                      </div>
                    </div>

                    <div
                      className="flex gap-1 mt-4 pt-3 border-t border-stone-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setDetailJob(job)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-stone-500 text-xs py-2 bg-stone-50 rounded-lg"
                      >
                        <MessageSquare size={13} /> Notes
                      </button>
                      <button
                        onClick={() => openEdit(job)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-stone-500 text-xs py-2 bg-stone-50 rounded-lg"
                      >
                        <Pencil size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(job.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-rose-500 text-xs py-2 bg-rose-50/50 rounded-lg"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 px-2">
            <p className="text-[0.7rem] text-stone-400">
              Showing{" "}
              <span className="font-semibold text-stone-700">
                {total === 0 ? 0 : (page - 1) * limit + 1}
              </span>
              –
              <span className="font-semibold text-stone-700">
                {Math.min(page * limit, total)}
              </span>{" "}
              of {total}
            </p>
            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <button
                disabled={loading || page <= 1}
                onClick={prevPage}
                className="px-5 py-2 rounded-xl border border-[#E8E4DE] bg-white text-sm text-stone-600 disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-semibold text-stone-500">
                Page {page}
              </span>
              <button
                disabled={loading || !hasMore}
                onClick={nextPage}
                className="px-5 py-2 rounded-xl border border-[#E8E4DE] bg-white text-sm text-stone-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Overlay (Functions same as before) */}
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

      <JobModal
        open={modal.open}
        job={modal.job}
        onClose={() => setModal({ open: false, job: null })}
      />
      <LinkModal
        open={!!linkJob}
        initialValue={linkJob?.link || ""}
        onClose={() => setLinkJob(null)}
        onSave={handleSaveLink}
      />

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-200"
          >
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl"
            >
              <h3 className="font-semibold font-['Lora'] text-lg mb-2">
                Delete application?
              </h3>
              <p className="text-sm text-stone-500 mb-6">
                This will permanently remove the application and all its notes.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 text-sm font-medium border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-xl"
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
