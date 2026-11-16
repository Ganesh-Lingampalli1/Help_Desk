import React from "react";
import { Link } from "react-router-dom";
import {
  Clock,
  AlertTriangle,
  ArrowRight,
  Laptop,
  Code2,
  Wifi,
  KeyRound,
  LifeBuoy,
  UserCheck,
} from "lucide-react";
import StatusBadge from "../common/StatusBadge";
import PriorityBadge from "../common/PriorityBadge";

export const TicketTable = ({ tickets, showAssignee = true, onAssignClick }) => {
  if (!tickets || tickets.length === 0) {
    return null;
  }

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Hardware":
        return <Laptop className="w-3.5 h-3.5 text-blue-600" />;
      case "Software":
        return <Code2 className="w-3.5 h-3.5 text-purple-600" />;
      case "Network":
        return <Wifi className="w-3.5 h-3.5 text-emerald-600" />;
      case "Account Access":
        return <KeyRound className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <LifeBuoy className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const formatRelativeDue = (dueDateStr, isOverdue) => {
    if (!dueDateStr) return null;
    const due = new Date(dueDateStr);
    const now = new Date();
    const diffHours = Math.round((due - now) / (1000 * 60 * 60));

    if (isOverdue) {
      const overdueHours = Math.abs(diffHours);
      return (
        <span className="inline-flex items-center gap-1 font-bold text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
          <AlertTriangle className="w-3 h-3 text-rose-600" />
          {overdueHours > 24
            ? `${Math.round(overdueHours / 24)}d overdue`
            : `${overdueHours}h overdue`}
        </span>
      );
    }

    if (diffHours < 24) {
      return (
        <span className="inline-flex items-center gap-1 font-semibold text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          {diffHours <= 0 ? "<1h left" : `${diffHours}h left`}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
        <Clock className="w-3 h-3 text-slate-400" />
        {due.toLocaleDateString([], { month: "short", day: "numeric" })}
      </span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3 px-4">Ticket Identifier & Subject</th>
            <th className="py-3 px-4">Category</th>
            <th className="py-3 px-4">Priority</th>
            <th className="py-3 px-4">Workflow Status</th>
            {showAssignee && <th className="py-3 px-4">Assigned Agent</th>}
            <th className="py-3 px-4">SLA Deadline</th>
            <th className="py-3 px-4 text-right">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {tickets.map((ticket) => {
            const agent = ticket.assigned_agent || ticket.assignee;
            const creator = ticket.creator;
            const isResolvedOrClosed = ticket.status === "Resolved" || ticket.status === "Closed";

            return (
              <tr
                key={ticket.id}
                className="hover:bg-slate-50/70 transition-colors group"
              >
                {/* Ticket ID & Title */}
                <td className="py-3.5 px-4">
                  <div className="flex items-start gap-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/tickets/${ticket.id}`}
                          className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          #{ticket.ticket_number}
                        </Link>
                        <span className="text-[11px] text-slate-400">
                          {new Date(ticket.created_at).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="text-slate-900 font-semibold text-xs hover:text-blue-600 transition-colors line-clamp-1 max-w-xs sm:max-w-md block mt-0.5"
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        by <span className="text-slate-600 font-medium">{creator?.full_name || "Employee"}</span>
                      </p>
                    </div>
                  </div>
                </td>

                {/* Category with icon */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[11px]">
                    {getCategoryIcon(ticket.category)}
                    <span>{ticket.category}</span>
                  </span>
                </td>

                {/* Priority */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <PriorityBadge priority={ticket.priority} />
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <StatusBadge status={ticket.status} />
                </td>

                {/* Assignee */}
                {showAssignee && (
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {agent ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px] border border-blue-200 flex-shrink-0">
                          {agent.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800 truncate max-w-[120px]" title={agent.full_name}>
                          {agent.full_name}
                        </span>
                      </div>
                    ) : onAssignClick ? (
                      <button
                        onClick={() => onAssignClick(ticket)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                      >
                        <UserCheck className="w-3 h-3" />
                        Assign Agent
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60">
                        Unassigned
                      </span>
                    )}
                  </td>
                )}

                {/* SLA Deadline */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {isResolvedOrClosed ? (
                    <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Completed
                    </span>
                  ) : (
                    formatRelativeDue(ticket.due_at, ticket.is_overdue) || (
                      <span className="text-slate-400">-</span>
                    )
                  )}
                </td>

                {/* Action button */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-blue-600 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 bg-white transition-all shadow-2xs group-hover:border-slate-300"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TicketTable;
