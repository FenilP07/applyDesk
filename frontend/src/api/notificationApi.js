import { apiClient } from "./apiClient";

const notificationAPi = {
  get: (id = "") => apiClient.get(`/api/notification/${id}`),

  markAsRead: (id) => apiClient.patch(`/api/notification/${id}/read`),
};

export { notificationAPi };
