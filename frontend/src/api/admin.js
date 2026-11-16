import apiClient from "./client";

export const adminApi = {
  getDashboard: async () => {
    const response = await apiClient.get("/admin/dashboard");
    return response.data;
  },

  getAnalytics: async () => {
    const response = await apiClient.get("/admin/analytics");
    return response.data;
  },

  getUsers: async (params = {}) => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await apiClient.post("/admin/users", userData);
    return response.data;
  },

  updateUser: async (userId, userData) => {
    const response = await apiClient.patch(`/admin/users/${userId}`, userData);
    return response.data;
  },

  getAssignableAgents: async () => {
    const response = await apiClient.get("/admin/agents");
    return response.data;
  },
};
