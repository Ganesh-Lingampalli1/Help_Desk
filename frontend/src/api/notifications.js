import apiClient from "./client";

export const notificationsApi = {
  getNotifications: async (params = {}) => {
    const response = await apiClient.get("/notifications", { params });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post("/notifications/mark-all-read");
    return response.data;
  },
};
