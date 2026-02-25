import { create } from "zustand";
import { jobApi } from "../api/jobApi";

const normErr = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

const STATUSES = ["applied", "interview", "offer", "rejected"];

const normalizeJob = (job) => ({
  ...job,
  id: job._id || job.id,
});

const buildParams = (filters) => {
  const p = {};
  if (filters.status && filters.status !== "all") p.status = filters.status;
  if (filters.company?.trim()) p.company = filters.company.trim();
  if (filters.q?.trim()) p.q = filters.q.trim();
  return p;
};

const useJobStore = create((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  filters: {
    status: "all",
    q: "",
    company: "",
  },

  summary: {
    total: 0,
    byStatus: { applied: 0, interview: 0, offer: 0, rejected: 0 },
  },

  STATUS_OPTIONS: ["all", ...STATUSES],

  setFilter: (key, value) =>
    set((s) => ({ filters: { ...s.filters, [key]: value } })),

  clearError: () => set({ error: null }),

  fetchJobs: async () => {
    set({ loading: true, error: null });
    try {
      const params = buildParams(get().filters);
      const res = await jobApi.list(params);

      set({
        jobs: (res.data.data || []).map(normalizeJob),
        loading: false,
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: normErr(error) });
      return { success: false };
    }
  },

  fetchSummary: async () => {
    try {
      const res = await jobApi.summary();
      const data = res.data.data || {};
      set({
        summary: {
          total: data.total || 0,
          byStatus: {
            applied: 0,
            interview: 0,
            offer: 0,
            rejected: 0,
            ...(data.byStatus || {}),
          },
        },
      });
    } catch {}
  },

  createJob: async (payload) => {
    set({ error: null });

    const tempId = "temp-" + Date.now();

    const optimisticJob = normalizeJob({
      ...payload,
      _id: tempId,
      createdAt: new Date().toISOString(),
    });

    set((s) => ({
      jobs: [optimisticJob, ...s.jobs],
    }));

    try {
      const res = await jobApi.create(payload);
      const created = normalizeJob(res.data.data);

      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === tempId ? created : j)),
      }));

      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set((s) => ({
        jobs: s.jobs.filter((j) => j.id !== tempId),
        error: normErr(error),
      }));

      return { success: false };
    }
  },

  updateJob: async (id, payload) => {
    set({ error: null });

    const previousJobs = get().jobs;

    set((s) => ({
      jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...payload } : j)),
    }));

    try {
      const res = await jobApi.update(id, payload);
      const updated = normalizeJob(res.data.data);

      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? updated : j)),
      }));

      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ jobs: previousJobs, error: normErr(error) });
      return { success: false };
    }
  },

  deleteJob: async (id) => {
    set({ error: null });

    const previousJobs = get().jobs;

    set((s) => ({
      jobs: s.jobs.filter((j) => j.id !== id),
    }));

    try {
      await jobApi.remove(id);
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ jobs: previousJobs, error: normErr(error) });
      return { success: false };
    }
  },

  statusUpdate: async (id, payload) => {
    const previousJobs = get().jobs;

    set((s) => ({
      jobs: s.jobs.map((j) =>
        j.id === id ? { ...j, status: payload.status } : j,
      ),
    }));

    try {
      await jobApi.statusUpdate(id, payload);
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ jobs: previousJobs });
      return { success: false };
    }
  },
}));

export default useJobStore;
