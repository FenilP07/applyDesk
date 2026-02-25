import { useEffect, useState } from "react";
import useJobStore from "../store/jobStore";
import {
  Search,
  MapPin,
  Plus,
  Trash2,
  Building2,
  Calendar,
  Pencil,
} from "lucide-react";
import SelectStatus from "../components/SelectStatus";
import AddJobModal from "../modals/JobModal";

// ─── CONFIGURATION & STYLES ──────────────────────────────────────────────────

const TABLE_GRID_CLASS = "grid grid-cols-[2fr_1.1fr_1fr_1fr_72px] px-6";

const THEME = {
  label:
    "text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]",
  card: "bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden",
  inputContainer:
    "flex items-center gap-2 flex-1 rounded-xl px-3 bg-white border border-[#E8E4DE]",
};

// ─── REUSABLE SUB-COMPONENTS ─────────────────────────────────────────────────

function ActionButton({ icon: Icon, onClick, variant = "default", title }) {
  const isDelete = variant === "delete";
  const baseClasses =
    "w-7 h-7 rounded-lg flex items-center justify-center transition-all border border-transparent text-[#A8A29E]";
  const hoverClasses = isDelete
    ? "hover:bg-[#FFF1F2] hover:border-[#FECDD3] hover:text-[#BE123C]"
    : "hover:bg-[#F7F5F2] hover:border-[#E8E4DE] hover:text-[#57534E]";

  return (
    <button
      onClick={onClick}
      title={title}
      className={`${baseClasses} ${hoverClasses}`}
    >
      <Icon size={12} />
    </button>
  );
}

function TableHeader() {
  const headers = ["Position", "Location", "Status", "Applied", ""];
  return (
    <div
      className={`${TABLE_GRID_CLASS} py-3 bg-[#F7F5F2] border-b border-[#E8E4DE] hidden sm:grid`}
    >
      {headers.map((h, i) => (
        <span key={i} className={THEME.label}>
          {h}
        </span>
      ))}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

export default function JobsPage() {
  const {
    jobs,
    loading,
    error,
    filters,
    setFilter,
    fetchJobs,
    createJob,
    deleteJob,
    STATUS_OPTIONS,
  } = useJobStore();

  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, filters.status, filters.q]);

  const onCreate = async (form) => {
    const res = await createJob({ ...form, source: "manual" });
    if (res.success) setIsAddOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this application?")) deleteJob(id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] font-['DM_Sans']">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className={`${THEME.label} mb-1`}>
              {(jobs ?? []).length} total applications
            </p>
            <h1 className="text-3xl text-stone-900 font-semibold tracking-tight font-['Lora']">
              Applications
            </h1>
            <p className="text-sm mt-1 text-[#A8A29E]">
              Track and manage your job search.
            </p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#1C1917] text-[#F7F5F2] px-[18px] py-[9px] text-sm font-semibold transition-all hover:-translate-y-px shadow-sm"
          >
            <Plus size={14} /> Add Job
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
          <div className={THEME.inputContainer}>
            <Search size={14} className="text-[#A8A29E] shrink-0" />
            <input
              placeholder="Search by title or company..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="flex-1 text-sm py-2.5 outline-none bg-transparent text-[#1C1917]"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-xl text-sm px-[14px] py-[9px] bg-white border border-[#E8E4DE] text-[#57534E] outline-none cursor-pointer capitalize"
          >
            {(
              STATUS_OPTIONS ?? [
                "all",
                "applied",
                "interview",
                "offer",
                "rejected",
              ]
            ).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Table Content */}
        <div className={THEME.card}>
          <TableHeader />

          {loading ? (
            <div className="py-20 text-center text-sm text-[#A8A29E]">
              Loading applications...
            </div>
          ) : !error && jobs.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-[#EFEDE9] flex items-center justify-center mb-4 text-[#A8A29E]">
                <Building2 size={20} />
              </div>
              <p className="text-sm font-medium text-stone-500">
                No applications found
              </p>
              <p className="text-xs text-[#A8A29E] mt-1">
                Try adjusting filters or add a new job.
              </p>
            </div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`${TABLE_GRID_CLASS} py-4 items-center border-b border-[#EFEDE9] hover:bg-stone-50 group transition-colors`}
              >
                {/* Position */}
                <div>
                  <div className="text-sm font-medium text-stone-900">
                    {job.title}
                  </div>
                  <div className="text-xs text-[#A8A29E]">{job.company}</div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                  {job.location ? (
                    <>
                      <MapPin size={12} className="text-[#A8A29E]" />{" "}
                      {job.location}
                    </>
                  ) : (
                    <span className="text-[#D6D3D1]">—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <SelectStatus job={job} />
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-[#A8A29E]">
                  <Calendar size={12} />
                  {formatDate(job.dateApplied)}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionButton icon={Pencil} onClick={() => {}} title="Edit" />
                  <ActionButton
                    icon={Trash2}
                    onClick={() => handleDelete(job.id)}
                    variant="delete"
                    title="Delete"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AddJobModal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onCreate={onCreate}
      />
    </div>
  );
}
