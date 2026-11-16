import React, { useState } from "react";
import { Send, Lock, User as UserIcon, ShieldAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const CommentThread = ({ comments = [], onAddComment, isSubmitting = false }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const canPostInternalNotes = user?.role === "agent" || user?.role === "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    onAddComment({
      message: message.trim(),
      is_internal: canPostInternalNotes ? isInternal : false,
    });

    setMessage("");
    setIsInternal(false);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "agent":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "employee":
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
            No comments or messages yet. Start the conversation below.
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-xl border transition-all ${
                comment.is_internal
                  ? "bg-amber-50/60 border-amber-200 shadow-sm"
                  : "bg-white border-slate-200"
              }`}
            >
              {/* Internal Note Banner */}
              {comment.is_internal && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-md mb-3 border border-amber-200/60 w-fit">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Private Internal Note (Hidden from employee)</span>
                </div>
              )}

              {/* Author & Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-700">
                    {comment.author_name ? comment.author_name.charAt(0) : "U"}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 mr-2">
                      {comment.author_name}
                    </span>
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.2 rounded-full border ${getRoleBadge(
                        comment.author_role
                      )}`}
                    >
                      {comment.author_role}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400">
                  {new Date(comment.created_at).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Body */}
              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap pl-9">
                {comment.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input Box */}
      <form onSubmit={handleSubmit} className="card-white p-4 space-y-3">
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isInternal
              ? "Write a private note for support agents and administrators..."
              : "Post an update or reply..."
          }
          className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
          {canPostInternalNotes ? (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-amber-800 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                Make this a private internal note
              </span>
            </label>
          ) : (
            <span className="text-[11px] text-slate-400">
              Responses will be sent to the assigned support team.
            </span>
          )}

          <button
            type="submit"
            disabled={!message.trim() || isSubmitting}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              isInternal
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting
              ? "Posting..."
              : isInternal
              ? "Post Internal Note"
              : "Post Response"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CommentThread;
