import React from "react";
import { History, ArrowRight, User as UserIcon } from "lucide-react";

export const TicketHistoryList = ({ history = [] }) => {
  if (history.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-slate-100">
        No status transitions recorded yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {history.map((item, index) => (
        <div key={item.id || index} className="relative group">
          {/* Timeline Dot */}
          <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-600 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
          </div>

          <div className="card-white p-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                {item.old_status ? (
                  <>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold text-[11px]">
                      {item.old_status}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </>
                ) : (
                  <span className="text-slate-500 text-[11px]">Initial Status:</span>
                )}
                <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold text-[11px]">
                  {item.new_status}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                {new Date(item.created_at).toLocaleString([], {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {item.description && (
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              <span>
                By <strong className="text-slate-700 font-medium">{item.changer_name}</strong>{" "}
                ({item.changer_role})
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketHistoryList;
