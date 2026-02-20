import { apiClient } from "./apiClient";

export const jobApi = {
  create: (payload) => apiClient.post("/api/jobs", payload),
  list: (params) => apiClient.get("/api/jobs", { params }),
  update: (id, payload) => apiClient.put(`/api/jobs/${id}`, payload),
  remove: (id) => apiClient.delete(`/api/jobs/${id}`),
  summary: () => apiClient.get("/api/jobs/analytics/summary"),
};
