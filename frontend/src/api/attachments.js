import apiClient from "./client";

export const attachmentsApi = {
  upload: async (ticketId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post(`/tickets/${ticketId}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  downloadUrl: (ticketId, attachmentId) => {
    const token = localStorage.getItem("token");
    const baseURL = import.meta.env.VITE_API_BASE_URL
      ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
      : "/api/v1";
    return `${baseURL}/tickets/${ticketId}/attachments/${attachmentId}/download?token=${token}`;
  },

  downloadBlob: async (ticketId, attachmentId, filename) => {
    const response = await apiClient.get(
      `/tickets/${ticketId}/attachments/${attachmentId}/download`,
      { responseType: "blob" }
    );
    const blob = new Blob([response.data]);
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  },
};
