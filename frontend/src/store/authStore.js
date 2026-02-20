import { create } from "zustand";
import { authApi } from "../api/authApi";

const normErr = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong";

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,

  booting: true, // initial auth restore
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  bootstrap: async () => {
    set({ booting: true, error: null });

    try {
      const res = await authApi.me();
      set({
        user: res.data.user,
        isAuthenticated: true,
        booting: false,
      });
      return true;
    } catch (err) {
      set({
        user: null,
        isAuthenticated: false,
        booting: false,
      });
      return false;
    }
  },

  googleLogin: async (credential) => {
    set({ loading: true, error: null });
    try {
      const res = await authApi.googleSignIn(credential);
      set({
        user: res.data.user,
        isAuthenticated: true,
        loading: false,
      });
      return { success: true };
    } catch (err) {
      set({ loading: false, error: normErr(err) });
      return { success: false };
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      await authApi.logout();
    } catch {}
    set({ user: null, isAuthenticated: false, loading: false });
  },
}));

export default useAuthStore;
