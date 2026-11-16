import apiClient from "./client";

export const commentsApi = {
  getComments: async (ticketId) => {
    const response = await apiClient.get(`/tickets/${ticketId}/comments`);
    return response.data;
  },

  addComment: async (ticketId, commentData) => {
    const response = await apiClient.post(`/tickets/${ticketId}/comments`, commentData);
    return response.data;
  },
};
