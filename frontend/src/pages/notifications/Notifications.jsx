import React from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, LifeBuoy, ArrowRight, RefreshCw } from "lucide-react";
import { useNotifications } from "../../context/NotificationContext";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications, isLoading } =
    useNotifications();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Activity Feed</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Notifications</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Stay informed on ticket assignments, status updates, and support messages
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshNotifications}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh feed"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading your notifications..." />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="All caught up!"
            description="You don't have any notifications right now. Activity on your tickets will appear here."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 flex items-start gap-4 transition-colors ${
                  !notif.is_read ? "bg-blue-50/30" : "hover:bg-slate-50/60"
                }`}
              >
                {/* Dot */}
                <div className="pt-1 flex-shrink-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      !notif.is_read ? "bg-blue-600" : "bg-slate-300"
                    }`}
                  />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(notif.created_at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Action Link to Ticket */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {notif.ticket_id && (
                    <Link
                      to={`/tickets/${notif.ticket_id}`}
                      onClick={() => !notif.is_read && markAsRead(notif.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 transition-colors shadow-xs"
                    >
                      <span>View Ticket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!notif.is_read && (
                    <button
                      onClick={() => markAsRead(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
