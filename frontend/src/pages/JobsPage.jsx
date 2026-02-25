import { useEffect, useState } from "react";
import useJobStore from "../store/jobStore";
import { Search, Plus, Trash2, Pencil } from "lucide-react";
import SelectStatus from "../components/SelectStatus";
import JobModal from "../modals/JobModal";

const TABLE_GRID_CLASS = "grid grid-cols-[2fr_1.1fr_1fr_1fr_72px] px-6";

const THEME = {
  label:
    "text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]",
  card: "bg-white rounded-2xl border border-[#E8E4DE] overflow-hidden",
  inputContainer:
    "flex items-center gap-2 flex-1 rounded-xl px-3 bg-white border border-[#E8E4DE]",
};

function ActionButton({ icon: Icon, onClick, variant = "default", title }) {
  const isDelete = variant === "delete";

  const base =
    "w-7 h-7 rounded-lg flex items-center justify-center transition-all border border-transparent text-[#A8A29E]";

  const hover = isDelete
    ? "hover:bg-[#FFF1F2] hover:border-[#FECDD3] hover:text-[#BE123C]"
    : "hover:bg-[#F7F5F2] hover:border-[#E8E4DE] hover:text-[#57534E]";

  return (
    <button onClick={onClick} title={title} className={`${base} ${hover}`}>
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

export default function JobsPage() {
  const {
    jobs,
    loading,
    error,
    filters,
    setFilter,
    fetchJobs,
    createJob,
    updateJob,
    deleteJob,
    STATUS_OPTIONS,
  } = useJobStore();

  const [isOpen, setIsOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, [filters.status, filters.q]);

  const handleCreate = async (form) => {
    const res = await createJob({ ...form, source: "manual" });
    if (res.success) {
      setIsOpen(false);
      setEditingJob(null);
    }
  };

  const handleUpdate = async (id, form) => {
    const res = await updateJob(id, form);
    if (res.success) {
      setIsOpen(false);
      setEditingJob(null);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this application?")) {
      deleteJob(id);
    }
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
        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className={`${THEME.label} mb-1`}>
              {(jobs ?? []).length} total applications
            </p>
            <h1 className="text-3xl font-semibold tracking-tight font-['Lora']">
              Applications
            </h1>
            <p className="text-sm mt-1 text-[#A8A29E]">
              Track and manage your job search.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingJob(null);
              setIsOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-[#1C1917] text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition"
          >
            <Plus size={14} /> Add Job
          </button>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
          <div className={THEME.inputContainer}>
            <Search size={14} className="text-[#A8A29E]" />
            <input
              placeholder="Search by title or company..."
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="flex-1 text-sm py-2 outline-none bg-transparent"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-xl text-sm px-3 py-2 bg-white border border-[#E8E4DE]"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* ERROR */}
        {error && <div className="mb-4 text-sm text-red-600">{error}</div>}

        {/* TABLE */}
        <div className={THEME.card}>
          <TableHeader />

          {loading ? (
            <div className="py-20 text-center text-sm text-[#A8A29E]">
              Loading applications...
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-20 text-center">No applications found</div>
          ) : (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`${TABLE_GRID_CLASS} py-4 items-center border-b border-[#EFEDE9] hover:bg-stone-50 group`}
              >
                <div>
                  <div className="text-sm font-medium">{job.title}</div>
                  <div className="text-xs text-[#A8A29E]">{job.company}</div>
                </div>

                <div className="text-xs text-[#78716C]">
                  {job.location || "—"}
                </div>

                <div>
                  <SelectStatus job={job} />
                </div>

                <div className="text-xs text-[#A8A29E]">
                  {formatDate(job.dateApplied)}
                </div>

                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100">
                  <ActionButton
                    icon={Pencil}
                    onClick={() => {
                      setEditingJob(job);
                      setIsOpen(true);
                    }}
                    title="Edit"
                  />

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

      <JobModal
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          setEditingJob(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        job={editingJob}
      />
    </div>
  );
}
