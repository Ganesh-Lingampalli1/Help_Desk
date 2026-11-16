import apiClient from "./client";

export const ticketsApi = {
  getTickets: async (params = {}) => {
    const response = await apiClient.get("/tickets", { params });
    return response.data;
  },

  getTicket: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}`);
    return response.data;
  },

  createTicket: async (ticketData) => {
    const response = await apiClient.post("/tickets", ticketData);
    return response.data;
  },

  updateTicket: async (ticketId, ticketData) => {
    const response = await apiClient.patch(`/tickets/${ticketId}`, ticketData);
    return response.data;
  },

  updateStatus: async (ticketId, statusData) => {
    const response = await apiClient.patch(`/tickets/${ticketId}/status`, statusData);
    return response.data;
  },

  assignTicket: async (ticketId, assignData) => {
    const response = await apiClient.post(`/tickets/${ticketId}/assign`, assignData);
    return response.data;
  },

  getStats: async () => {
    const response = await apiClient.get("/tickets/stats");
    return response.data;
  },

  getHistory: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}/history`);
    return response.data;
  },
};
