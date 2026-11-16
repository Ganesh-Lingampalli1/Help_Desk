import apiClient from "./client";

export const authApi = {
  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response.data;
  },

  changePassword: async (passwordData) => {
    const response = await apiClient.patch("/auth/change-password", passwordData);
    return response.data;
  },
};
