import React, { useState } from "react";
import { Paperclip, X, AlertCircle } from "lucide-react";
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from "../../utils/constants";

export const TicketForm = ({ onSubmit, isSubmitting = false, initialData = null }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    category: initialData?.category || TICKET_CATEGORIES[0],
    priority: initialData?.priority || "Medium",
  });
  const [attachment, setAttachment] = useState(null);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) {
      errs.title = "Ticket title is required.";
    } else if (formData.title.length > 200) {
      errs.title = "Title cannot exceed 200 characters.";
    }

    if (!formData.description.trim()) {
      errs.description = "Please provide a detailed description of the issue.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData, attachment);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          file: "File size exceeds 5MB limit.",
        }));
        return;
      }
      setAttachment(file);
      setErrors((prev) => ({ ...prev, file: null }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          Ticket Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief summary of the technical problem..."
          className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
            errors.title ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
          }`}
        />
        {errors.title && (
          <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Category & Priority grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            {TICKET_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Priority <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            {TICKET_PRIORITIES.map((prio) => (
              <option key={prio} value={prio}>
                {prio}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          Detailed Description <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={6}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Include step-by-step reproduction details, error messages, and system identifiers..."
          className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
            errors.description ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
          }`}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.description}
          </p>
        )}
      </div>

      {/* Supporting Attachment */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
          Attachment (Screenshot / Log File)
        </label>
        {attachment ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
            <div className="flex items-center gap-2 truncate">
              <Paperclip className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span className="font-medium text-slate-800 truncate">{attachment.name}</span>
              <span className="text-slate-400">({(attachment.size / 1024).toFixed(0)} KB)</span>
            </div>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="p-1 text-slate-400 hover:text-rose-600 rounded"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-blue-400 transition-colors bg-white">
            <label className="cursor-pointer text-center">
              <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1" />
              <span className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Click to attach a file
              </span>
              <span className="text-xs text-slate-400 block mt-0.5">
                PNG, JPG, PDF, DOCX, TXT, ZIP up to 5MB
              </span>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".png,.jpg,.jpeg,.gif,.pdf,.docx,.txt,.zip"
                className="hidden"
              />
            </label>
          </div>
        )}
        {errors.file && (
          <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.file}
          </p>
        )}
      </div>

      {/* Submit button */}
      <div className="pt-2 flex justify-end gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Submitting Ticket..." : initialData ? "Save Changes" : "Create Ticket"}
        </button>
      </div>
    </form>
  );
};

export default TicketForm;
