import { apiClient } from "./apiClient";

export const jobNoteApi = {
  listByJob: (jobId, params) =>
    apiClient.get(`/api/jobs/${jobId}/notes`, { params }),

  createForJob: (jobId, payload) =>
    apiClient.post(`/api/jobs/${jobId}/notes`, payload),

  update: (noteId, payload) => apiClient.patch(`/api/notes/${noteId}`, payload),

  remove: (noteId) => apiClient.delete(`/api/notes/${noteId}`),

  done: (noteId, done) =>
    apiClient.patch(`/api/notes/${noteId}/done`, { done }),

  reminders: (params) => apiClient.get(`/api/notes/reminders`, { params }),
};
