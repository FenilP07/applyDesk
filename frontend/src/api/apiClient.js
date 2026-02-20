import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;
let waiters = [];

const flushWaiters = (err) => {
  waiters.forEach(({ resolve, reject }) => (err ? reject(err) : resolve()));
  waiters = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401) return Promise.reject(error);

    if (original?._retry) return Promise.reject(error);

    const url = original?.url || "";
    const skip = [
      "/api/auth/google",
      "/api/auth/refresh",
      "/api/auth/logout",
      // "/api/auth/me",
    ];

    if (skip.some((s) => url.includes(s))) return Promise.reject(error);

    original._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waiters.push({
          resolve: () => resolve(apiClient(original)),
          reject,
        });
      });
    }
    isRefreshing = true;

    try {
      await apiClient.post("/api/auth/refresh");
      flushWaiters(null);
      return apiClient(original);
    } catch (err) {
      flushWaiters(err);
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);

export { apiClient };
