import React, { useState } from "react";
import { Download, Paperclip, Plus, FileText, Image as ImageIcon, Archive } from "lucide-react";
import { attachmentsApi } from "../../api/attachments";
import toast from "react-hot-toast";

export const AttachmentList = ({ ticketId, attachments = [], onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleDownload = async (att) => {
    try {
      await attachmentsApi.downloadBlob(ticketId, att.id, att.original_filename);
    } catch {
      toast.error("Failed to download attachment.");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size cannot exceed 5MB.");
      return;
    }

    try {
      setIsUploading(true);
      const res = await attachmentsApi.upload(ticketId, file);
      if (res.success) {
        toast.success("File attached successfully!");
        onUploadSuccess && onUploadSuccess();
      }
    } catch (err) {
      const msg = err.response?.data?.error?.message || "Failed to upload file.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const getFileIcon = (contentType = "") => {
    if (contentType.includes("image")) return ImageIcon;
    if (contentType.includes("zip")) return Archive;
    return FileText;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Upload button banner */}
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Attachments ({attachments.length})
        </span>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer transition-colors shadow-sm">
          <Plus className="w-3.5 h-3.5 text-blue-600" />
          <span>{isUploading ? "Uploading..." : "Attach File"}</span>
          <input
            type="file"
            onChange={handleFileSelect}
            disabled={isUploading}
            accept=".png,.jpg,.jpeg,.gif,.pdf,.docx,.txt,.zip"
            className="hidden"
          />
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
          No files attached to this ticket.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => {
            const Icon = getFileIcon(att.content_type);
            return (
              <div
                key={att.id}
                className="card-white p-3 flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate" title={att.original_filename}>
                      {att.original_filename}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {formatSize(att.file_size)} • {att.uploader_name}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(att)}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 flex-shrink-0 transition-colors"
                  title="Download File"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AttachmentList;
