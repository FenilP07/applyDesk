import { useEffect, useMemo, useState } from "react";
import useJobStore from "../store/jobStore";
import { 
  Search, 
  MapPin, 
  Plus, 
  Trash2, 
  Building2, 
  Calendar, 
  X,
  Filter
} from "lucide-react";

// --- Components ---

const StatusPill = ({ status }) => {
  const map = {
    applied: "bg-blue-50 text-blue-700 border-blue-100",
    interview: "bg-amber-50 text-amber-700 border-amber-100",
    offer: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rejected: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
      {status}
    </span>
  );
};

const InputField = ({ icon: Icon, ...props }) => (
  <div className="relative flex items-center w-full">
    {Icon && <Icon className="absolute left-3 text-gray-400" size={16} />}
    <input
      {...props}
      className={`w-full rounded-xl border border-gray-200 bg-white py-2 ${Icon ? 'pl-10' : 'px-3'} pr-3 text-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none`}
    />
  </div>
);

// --- Modals ---

function AddJobModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    status: "applied",
    dateApplied: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) setForm(s => ({ ...s, dateApplied: new Date().toISOString().slice(0, 10) }));
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-xl font-bold text-gray-800">New Application</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Job Title</label>
            <InputField placeholder="e.g. Frontend Engineer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Company</label>
              <InputField placeholder="e.g. Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Location</label>
              <InputField placeholder="Remote / City" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</label>
              <select 
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option value="applied">Applied</option>
                <option value="interview">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Date Applied</label>
              <InputField type="date" value={form.dateApplied} onChange={e => setForm({ ...form, dateApplied: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100">Cancel</button>
          <button onClick={() => onCreate(form)} className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow-md shadow-blue-200">Save Application</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

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
    if (window.confirm("Are you sure you want to delete this application?")) {
      deleteJob(id);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your job search progress</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
        >
          <Plus size={18} />
          Add Job
        </button>
      </div>

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <InputField 
            icon={Search} 
            placeholder="Search by title or company..." 
            value={filters.q}
            onChange={(e) => setFilter("q", e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="w-full sm:w-48">
             <InputField 
               icon={Building2} 
               placeholder="Company..." 
               value={filters.company}
               onChange={(e) => setFilter("company", e.target.value)}
             />
          </div>
          <div className="relative w-full sm:w-40">
            <Filter className="absolute left-3 top-2.5 text-gray-400 pointer-events-none" size={16} />
            <select 
              value={filters.status} 
              onChange={(e) => setFilter("status", e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-8 text-sm focus:border-blue-500 outline-none capitalize"
            >
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center p-20 text-gray-400 animate-pulse">Loading applications...</div>
        ) : jobs.length === 0 ? (
          <div className="p-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Building2 className="text-gray-300" size={32} />
            </div>
            <p className="text-gray-500 italic">No applications found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="min-w-full divide-y divide-gray-50">
            {/* Table Header - Hidden on mobile */}
            <div className="hidden grid-cols-12 gap-4 bg-gray-50/50 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:grid">
              <div className="col-span-5">Position & Company</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">Date Applied</div>
              <div className="col-span-1 text-right">Action</div>
            </div>

            {/* List Items */}
            {jobs.map((j) => (
              <div key={j.id} className="group grid grid-cols-12 items-center gap-4 px-6 py-5 transition-all hover:bg-gray-50/80">
                <div className="col-span-12 sm:col-span-5">
                  <div className="font-bold text-gray-900 text-base">{j.title}</div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                    <span className="font-medium text-blue-600">{j.company}</span>
                    {j.location && (
                      <span className="flex items-center gap-1">
                        <span className="text-gray-300">•</span>
                        <MapPin size={14} />
                        {j.location}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="col-span-6 sm:col-span-3">
                  <StatusPill status={j.status} />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar size={14} className="text-gray-400" />
                    {j.dateApplied ? new Date(j.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A"}
                  </div>
                </div>

                <div className="col-span-12 flex justify-end sm:col-span-1">
                  <button
                    onClick={() => handleDelete(j.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
                    title="Delete Application"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddJobModal open={isAddOpen} onClose={() => setIsAddOpen(false)} onCreate={onCreate} />
    </div>
  );
}