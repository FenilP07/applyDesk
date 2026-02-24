import { create } from "zustand";
import { notificationAPi } from "../api/notificationApi";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  currentNotification: null,
  loading: false,

  fetchAllNotifications: async () => {
    try {
      set({ loading: true });
      const { data } = await notificationAPi.get("/");
      const unread = data.notifications.filter((n) => !n.read).length;
      set({
        notifications: data.notifications,
        loading: false,
        unreadCount: unread,
      });
    } catch (error) {
      set({ loading: false });
      console.error("Failed to fetch notifications", error);
    }
  },

  fetchNotificationById: async (id) => {
    try {
      set({ loading: true, currentNotification: null });

      const { data } = await notificationAPi.get(id);

      set({
        currentNotification: data.notification,
        loading: false,
      });

      get().markAsReadLocally(id);
    } catch (error) {
      set({ loading: false });
      console.error("Failed to fetch notification detail", error);
    }
  },
  markAsReadLocally: (id) => {
    const updatedNotifications = get().notifications.map((n) =>
      n._id === id ? { ...n, read: true } : n,
    );
    const unread = updatedNotifications.filter((n) => !n.read).length;

    set({
      notifications: updatedNotifications,
      unreadCount: unread,
    });
  },
}));

export default useNotificationStore;
