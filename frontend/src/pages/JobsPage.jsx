import { useEffect, useState } from "react";
import useJobStore from "../store/jobStore";
import { Search, MapPin, Plus, Trash2, Building2, Calendar, X, Pencil } from "lucide-react";

// ─── Status pill ───────────────────────────────────────────────────────────────
const PILL_STYLES = {
  applied:   { background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #DBEAFE" },
  interview: { background: "#FEF3C7", color: "#B45309", border: "1px solid #FDE68A" },
  offer:     { background: "#EAF4EF", color: "#2D6A4F", border: "1px solid #BBF7D0" },
  rejected:  { background: "#FFF1F2", color: "#BE123C", border: "1px solid #FECDD3" },
};

function StatusPill({ status }) {
  const s = PILL_STYLES[status] ?? { background: "#F5F5F4", color: "#78716C", border: "1px solid #E7E5E4" };
  return (
    <span
      className="inline-flex items-center rounded-full font-semibold capitalize"
      style={{ padding: "3px 9px", fontSize: "0.62rem", letterSpacing: "0.04em", textTransform: "uppercase", ...s }}
    >
      {status}
    </span>
  );
}

// ─── Input field ───────────────────────────────────────────────────────────────
function InputField({ label, icon: Icon, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#A8A29E", fontSize: "0.62rem" }}>
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && <Icon size={14} className="absolute left-3" style={{ color: "#A8A29E" }} />}
        <input
          {...props}
          className="w-full rounded-xl text-sm outline-none transition-all"
          style={{
            background: "#F7F5F2",
            border: "1px solid #E8E4DE",
            padding: Icon ? "9px 12px 9px 34px" : "9px 12px",
            color: "#1C1917",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={e => { e.target.style.borderColor = "#D9D4CC"; e.target.style.boxShadow = "0 0 0 3px rgba(28,25,23,0.04)"; }}
          onBlur={e => { e.target.style.borderColor = "#E8E4DE"; e.target.style.boxShadow = "none"; }}
        />
      </div>
    </div>
  );
}

// ─── Add Job Modal ─────────────────────────────────────────────────────────────
function AddJobModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "", company: "", location: "", status: "applied",
    dateApplied: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) setForm(f => ({ ...f, dateApplied: new Date().toISOString().slice(0, 10) }));
  }, [open]);

  if (!open) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(28,25,23,0.35)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: "#fff", border: "1px solid #E8E4DE", boxShadow: "0 24px 48px rgba(28,25,23,0.12)" }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: "1px solid #E8E4DE" }}>
          <h2
            className="text-lg text-stone-900"
            style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.02em" }}
          >
            New Application
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-100"
            style={{ color: "#A8A29E", border: "none", background: "none", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-7 py-6 flex flex-col gap-4">
          <InputField label="Job Title" placeholder="e.g. Frontend Engineer" value={form.title} onChange={set("title")} />

          <div className="grid grid-cols-2 gap-4">
            <InputField label="Company" placeholder="e.g. Stripe" value={form.company} onChange={set("company")} />
            <InputField label="Location" placeholder="Remote / City" value={form.location} onChange={set("location")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#A8A29E", fontSize: "0.62rem" }}>Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full rounded-xl text-sm outline-none"
                style={{
                  background: "#F7F5F2", border: "1px solid #E8E4DE",
                  padding: "9px 12px", color: "#1C1917",
                  fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                }}
              >
                <option value="applied">Applied</option>
                <option value="interview">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <InputField label="Date Applied" type="date" value={form.dateApplied} onChange={set("dateApplied")} />
          </div>
        </div>

        {/* Modal footer */}
        <div className="px-7 py-5 flex gap-3" style={{ background: "#F7F5F2", borderTop: "1px solid #E8E4DE" }}>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl text-sm font-semibold transition-colors"
            style={{ background: "#fff", border: "1px solid #E8E4DE", color: "#57534E", padding: "10px", cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(form)}
            className="flex-1 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
            style={{ background: "#1C1917", color: "#F7F5F2", border: "none", padding: "10px", cursor: "pointer" }}
          >
            Save Application
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function JobsPage() {
  const { jobs, loading, error, filters, setFilter, fetchJobs, createJob, deleteJob, STATUS_OPTIONS } = useJobStore();
  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, filters.status, filters.q, filters.company]);

  const onCreate = async (form) => {
    const res = await createJob({ ...form, source: "manual" });
    if (res.success) setIsAddOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this application?")) deleteJob(id);
  };

  return (
    <div className="min-h-screen" style={{ background: "#F7F5F2", fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-10">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#A8A29E", fontSize: "0.62rem", letterSpacing: "0.1em" }}>
              {(jobs ?? []).length} total applications
            </p>
            <h1
              className="text-3xl text-stone-900"
              style={{ fontFamily: "'Lora', serif", fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.15 }}
            >
              Applications
            </h1>
            <p className="text-sm mt-1" style={{ color: "#A8A29E" }}>Track and manage your job search.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              background: "#1C1917", color: "#F7F5F2",
              padding: "9px 18px", border: "none", cursor: "pointer",
              boxShadow: "0 1px 3px rgba(28,25,23,0.12)",
            }}
          >
            <Plus size={14} />
            Add Job
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-5">
          {/* Search */}
          <div
            className="flex items-center gap-2 flex-1 rounded-xl px-3"
            style={{ background: "#fff", border: "1px solid #E8E4DE" }}
          >
            <Search size={14} style={{ color: "#A8A29E", flexShrink: 0 }} />
            <input
              placeholder="Search by title or company…"
              value={filters.q}
              onChange={(e) => setFilter("q", e.target.value)}
              className="flex-1 text-sm outline-none py-2.5"
              style={{ background: "none", border: "none", color: "#1C1917", fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilter("status", e.target.value)}
            className="rounded-xl text-sm outline-none capitalize"
            style={{
              background: "#fff", border: "1px solid #E8E4DE",
              padding: "9px 14px", color: "#57534E",
              fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            }}
          >
            {(STATUS_OPTIONS ?? ["all", "applied", "interview", "offer", "rejected"]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E8E4DE" }}>

          {/* Table head */}
          <div
            className="hidden sm:grid px-6 py-3"
            style={{
              gridTemplateColumns: "2fr 1.1fr 1fr 1fr 72px",
              borderBottom: "1px solid #E8E4DE",
              background: "#F7F5F2",
            }}
          >
            {["Position", "Location", "Status", "Applied", ""].map((h, i) => (
              <div key={i} className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#A8A29E", fontSize: "0.6rem" }}>
                {h}
              </div>
            ))}
          </div>

          {/* States */}
          {loading && (
            <div className="flex items-center justify-center py-20 text-sm" style={{ color: "#A8A29E" }}>
              Loading applications…
            </div>
          )}

          {!loading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#EFEDE9" }}>
                <Building2 size={20} style={{ color: "#A8A29E" }} />
              </div>
              <p className="text-sm font-medium text-stone-500">No applications found</p>
              <p className="text-xs mt-1" style={{ color: "#A8A29E" }}>Try adjusting your filters or add a new one.</p>
            </div>
          )}

          {!loading && jobs.map((job) => (
            <div
              key={job.id}
              className="group grid px-6 py-4 items-center transition-colors hover:bg-stone-50"
              style={{
                gridTemplateColumns: "2fr 1.1fr 1fr 1fr 72px",
                borderBottom: "1px solid #EFEDE9",
              }}
            >
              {/* Position */}
              <div>
                <div className="text-sm font-medium text-stone-900">{job.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "#A8A29E" }}>{job.company}</div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#78716C" }}>
                {job.location ? (
                  <>
                    <MapPin size={12} style={{ color: "#A8A29E", flexShrink: 0 }} />
                    {job.location}
                  </>
                ) : (
                  <span style={{ color: "#D6D3D1" }}>—</span>
                )}
              </div>

              {/* Status */}
              <div>
                <StatusPill status={job.status} />
              </div>

              {/* Date */}
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "#A8A29E" }}>
                <Calendar size={12} style={{ flexShrink: 0 }} />
                {job.dateApplied
                  ? new Date(job.dateApplied).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "—"}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "none", border: "1px solid transparent", color: "#A8A29E", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#F7F5F2"; e.currentTarget.style.borderColor = "#E8E4DE"; e.currentTarget.style.color = "#57534E"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#A8A29E"; }}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                  style={{ background: "none", border: "1px solid transparent", color: "#A8A29E", cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#FFF1F2"; e.currentTarget.style.borderColor = "#FECDD3"; e.currentTarget.style.color = "#BE123C"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.color = "#A8A29E"; }}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AddJobModal open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={onCreate} />
    </div>
  );
}