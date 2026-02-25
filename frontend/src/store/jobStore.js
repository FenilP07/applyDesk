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
      const byStatus = {
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        ...(data.byStatus || {}),
      };
      set({ summary: { total: data.total || 0, byStatus } });
    } catch (error) {}
  },
  createJob: async (payload) => {
    set({
      error: null,
    });
    try {
      const res = await jobApi.create(payload);
      const created = normalizeJob(res.data.data);
      set((s) => ({
        jobs: [created, ...s.jobs],
      }));
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ error: normErr(error) });
      return { success: false };
    }
  },

  updateJob: async (id, payload) => {
    set({ error: null });
    try {
      const res = await jobApi.update(id, payload);
      const updated = normalizeJob(res.data.data);
      set((s) => ({
        jobs: s.jobs.map((j) => (j.id === id ? updated : j)),
      }));
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ error: normErr(error) });
      return { success: false };
    }
  },

  deleteJob: async (id) => {
    set({ error: null });
    try {
      await jobApi.remove(id);
      set((s) => ({ jobs: s.jobs.filter((j) => j.id !== id) }));
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      set({ error: normErr(error) });
      return { success: false };
    }
  },

  statusUpdate: async (id, payload) => {
    try {
      set((state) => ({
        jobs: state.jobs.map((job) =>
          job.id === id ? { ...job, status: payload.status } : job,
        ),
      }));
      await jobApi.statusUpdate(id, payload);
      get().fetchSummary();
      return { success: true };
    } catch (error) {
      await get().fetchJobs();
      return { success: false };
    }
  },

  STATUS_OPTIONS: ["all", ...STATUSES],
}));

export default useJobStore;
