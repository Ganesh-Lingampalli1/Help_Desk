import React from "react";
import { Inbox, Plus } from "lucide-react";

export const EmptyState = ({
  icon: Icon = Inbox,
  title = "No tickets found",
  description = "No records match your selected criteria or search term.",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card-white p-12 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-500 mb-4 border border-slate-200">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-6">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
