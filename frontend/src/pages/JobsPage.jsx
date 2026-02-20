import { useEffect, useMemo, useState } from "react";
import useJobStore from "../store/jobStore";

const StatusPill = ({ status }) => {
  const base = "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium";
  const map = {
    applied: "bg-blue-50 text-blue-700",
    interview: "bg-amber-50 text-amber-700",
    offer: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
  };
  return <span className={`${base} ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>;
};

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring ${
      props.className || ""
    }`}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring ${
      props.className || ""
    }`}
  />
);

function AddJobModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    status: "applied",
    dateApplied: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) {
      setForm((s) => ({
        ...s,
        dateApplied: new Date().toISOString().slice(0, 10),
      }));
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-lg">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-lg font-semibold">Add Job</div>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100">
            ✕
          </button>
        </div>

        <div className="grid gap-3">
          <div>
            <div className="mb-1 text-xs text-gray-500">Job Title</div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Software Developer Intern"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-gray-500">Company</div>
              <Input
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Rogers"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-500">Location (optional)</div>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Toronto, ON"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="mb-1 text-xs text-gray-500">Status</div>
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="applied">applied</option>
                <option value="interview">interview</option>
                <option value="offer">offer</option>
                <option value="rejected">rejected</option>
              </Select>
            </div>
            <div>
              <div className="mb-1 text-xs text-gray-500">Date Applied</div>
              <Input
                type="date"
                value={form.dateApplied}
                onChange={(e) => setForm({ ...form, dateApplied: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-2 flex gap-2">
            <button
              onClick={onClose}
              className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onCreate(form)}
              className="w-full rounded-xl bg-black px-3 py-2 text-sm text-white hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
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
    deleteJob,
    STATUS_OPTIONS,
  } = useJobStore();

  const [isAddOpen, setIsAddOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, filters.status, filters.q, filters.company]);

  const filteredCount = useMemo(() => jobs.length, [jobs]);

  const onCreate = async (form) => {
    const payload = {
      title: form.title,
      company: form.company,
      location: form.location || null,
      status: form.status,
      dateApplied: form.dateApplied,
      source: "manual",
    };

    const res = await createJob(payload);
    if (res.success) setIsAddOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Applications</h1>
          <p className="text-sm text-gray-500">{filteredCount} visible</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
        >
          + Add Job
        </button>
      </div>

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Input
          value={filters.q}
          onChange={(e) => setFilter("q", e.target.value)}
          placeholder="Search title or company…"
        />
        <Input
          value={filters.company}
          onChange={(e) => setFilter("company", e.target.value)}
          placeholder="Company filter (optional)…"
        />
        <Select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid grid-cols-12 gap-2 border-b bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
          <div className="col-span-4">Title</div>
          <div className="col-span-3">Company</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Applied</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {loading ? (
          <div className="p-4 text-sm text-gray-500">Loading…</div>
        ) : jobs.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No applications yet. Add one manually, or use the LinkedIn extension.
          </div>
        ) : (
          <div className="divide-y">
            {jobs.map((j) => (
              <div key={j.id} className="grid grid-cols-12 gap-2 px-3 py-3 text-sm">
                <div className="col-span-4 font-medium">{j.title}</div>
                <div className="col-span-3">{j.company}</div>
                <div className="col-span-2">
                  <StatusPill status={j.status} />
                </div>
                <div className="col-span-2 text-gray-600">
                  {j.dateApplied ? new Date(j.dateApplied).toLocaleDateString() : "-"}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => deleteJob(j.id)}
                    className="rounded-lg px-2 py-1 text-xs hover:bg-gray-100"
                    title="Delete"
                  >
                    🗑
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