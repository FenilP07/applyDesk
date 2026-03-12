import { apiClient } from "./apiClient";

export const jobApi = {
  create: (payload) => apiClient.post("/api/jobs", payload),
  list: (params) => apiClient.get("/api/jobs", { params }),
  update: (id, payload) => apiClient.patch(`/api/jobs/${id}`, payload),
  remove: (id) => apiClient.delete(`/api/jobs/${id}`),
  summary: () => apiClient.get("/api/jobs/analytics/summary"),
  statusUpdate: (id, payload) =>
    apiClient.patch(`/api/jobs/${id}/status`, payload),
  getById: (id) => apiClient.get(`/api/jobs/${id}`),
  timeline: (id) => apiClient.get(`/api/jobs/${id}/timeline`),
  uploadDocuments: (id, files) => {
    const formData = new FormData();

    if (files.resume) formData.append("resume", files.resume);
    if (files.coverLetter) {
      formData.append("coverLetter", files.coverLetter);
    }

    return apiClient.post(`/api/jobs/${id}/documents`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};
