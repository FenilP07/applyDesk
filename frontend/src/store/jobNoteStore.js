import { create } from "zustand";
import { jobNoteApi } from "../api/jobNoteApi";

const normErr = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

const normalizeNote = (n) => ({
  ...n,
  id: n._id || n.id,
});

export const useJobNotesStore = create((set, get) => ({
  byJobId: {}, // jobId -> { items, loading, error, page, hasMore }

  ensureBucket: (jobId) => {
    const s = get();
    if (s.byJobId[jobId]) return;
    set((st) => ({
      byJobId: {
        ...st.byJobId,
        [jobId]: {
          items: [],
          loading: false,
          error: null,
          page: 1,
          hasMore: true,
        },
      },
    }));
  },

  fetchNotes: async (jobId, { page = 1, limit = 25 } = {}) => {
    get().ensureBucket(jobId);
    set((st) => ({
      byJobId: {
        ...st.byJobId,
        [jobId]: { ...st.byJobId[jobId], loading: true, error: null },
      },
    }));

    try {
      const res = await jobNoteApi.listByJob(jobId, { page, limit });
      const items = (res.data.items || []).map(normalizeNote);

      set((st) => {
        const prev = st.byJobId[jobId];
        const merged = page === 1 ? items : [...prev.items, ...items];
        return {
          byJobId: {
            ...st.byJobId,
            [jobId]: {
              ...prev,
              items: merged,
              loading: false,
              page,
              hasMore: Boolean(res.data.hasMore),
            },
          },
        };
      });

      return { success: true };
    } catch (err) {
      set((st) => ({
        byJobId: {
          ...st.byJobId,
          [jobId]: {
            ...st.byJobId[jobId],
            loading: false,
            error: normErr(err),
          },
        },
      }));
      return { success: false };
    }
  },

  addNote: async (jobId, payload) => {
    get().ensureBucket(jobId);

    const tempId = "temp-" + Date.now();
    const optimistic = normalizeNote({
      _id: tempId,
      jobId,
      text: payload.text,
      pinned: Boolean(payload.pinned),
      remindAt: payload.remindAt || null,
      doneAt: null,
      edited: false,
      createdAt: new Date().toISOString(),
    });

    set((st) => {
      const prev = st.byJobId[jobId];
      return {
        byJobId: {
          ...st.byJobId,
          [jobId]: { ...prev, items: [optimistic, ...prev.items] },
        },
      };
    });

    try {
      const res = await jobNoteApi.createForJob(jobId, payload);
      const created = normalizeNote(res.data);

      set((st) => {
        const prev = st.byJobId[jobId];
        return {
          byJobId: {
            ...st.byJobId,
            [jobId]: {
              ...prev,
              items: prev.items.map((n) => (n.id === tempId ? created : n)),
            },
          },
        };
      });

      return { success: true };
    } catch (err) {
      set((st) => {
        const prev = st.byJobId[jobId];
        return {
          byJobId: {
            ...st.byJobId,
            [jobId]: {
              ...prev,
              items: prev.items.filter((n) => n.id !== tempId),
            },
          },
        };
      });
      return { success: false, error: normErr(err) };
    }
  },

  updateNote: async (jobId, noteId, payload) => {
    get().ensureBucket(jobId);
    const prevItems = get().byJobId[jobId]?.items || [];

    set((st) => {
      const prev = st.byJobId[jobId];
      return {
        byJobId: {
          ...st.byJobId,
          [jobId]: {
            ...prev,
            items: prev.items.map((n) =>
              n.id === noteId ? { ...n, ...payload } : n,
            ),
          },
        },
      };
    });

    try {
      const res = await jobNoteApi.update(noteId, payload);
      const updated = normalizeNote(res.data);

      set((st) => {
        const prev = st.byJobId[jobId];
        return {
          byJobId: {
            ...st.byJobId,
            [jobId]: {
              ...prev,
              items: prev.items.map((n) => (n.id === noteId ? updated : n)),
            },
          },
        };
      });

      return { success: true };
    } catch (err) {
      set((st) => ({
        byJobId: {
          ...st.byJobId,
          [jobId]: { ...st.byJobId[jobId], items: prevItems },
        },
      }));
      return { success: false, error: normErr(err) };
    }
  },

  deleteNote: async (jobId, noteId) => {
    get().ensureBucket(jobId);
    const prevItems = get().byJobId[jobId]?.items || [];

    set((st) => {
      const prev = st.byJobId[jobId];
      return {
        byJobId: {
          ...st.byJobId,
          [jobId]: {
            ...prev,
            items: prev.items.filter((n) => n.id !== noteId),
          },
        },
      };
    });

    try {
      await jobNoteApi.remove(noteId);
      return { success: true };
    } catch (err) {
      set((st) => ({
        byJobId: {
          ...st.byJobId,
          [jobId]: { ...st.byJobId[jobId], items: prevItems },
        },
      }));
      return { success: false, error: normErr(err) };
    }
  },
}));
