import { apiClient } from "./apiClient";

const authApi = {
  googleSignIn: (credential) =>
    apiClient.post("/api/auth/google", { credential }),

  me: () => apiClient.get("/api/auth/me"),
  refresh: () => apiClient.post("/api/auth/refresh"),
  logout: () => apiClient.post("/api/auth/logout"),
  test: () => apiClient.post("/api/auth/test-connection"),
};

export { authApi };
