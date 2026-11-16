import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Inbox,
  UserCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Zap,
  Laptop,
  Code2,
  Wifi,
  KeyRound,
  LifeBuoy,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../api/tickets";
import StatCard from "../../components/common/StatCard";
import TicketTable from "../../components/tickets/TicketTable";
import PriorityBadge from "../../components/common/PriorityBadge";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const AgentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, assignedRes, unassignedRes] = await Promise.all([
        ticketsApi.getStats(),
        ticketsApi.getTickets({
          assigned_to: user?.id,
          per_page: 5,
          sort_by: "created_at",
          sort_order: "desc",
        }),
        ticketsApi.getTickets({
          unassigned: "true",
          per_page: 6,
          sort_by: "created_at",
          sort_order: "asc",
        }),
      ]);

      setStats(statsRes.stats);
      setAssignedTickets(assignedRes.tickets || []);
      setUnassignedTickets(unassignedRes.tickets || []);
    } catch {
      toast.error("Failed to load agent dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  const handleClaimTicket = async (ticketId, ticketNum) => {
    setClaimingId(ticketId);
    try {
      await ticketsApi.assignTicket(ticketId, { agent_id: user.id });
      toast.success(`Ticket #${ticketNum} claimed and assigned to you!`);
      fetchDashboardData();
    } catch {
      toast.error("Failed to claim ticket.");
    } finally {
      setClaimingId(null);
    }
  };

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

  if (isLoading && !stats) {
    return (
      <div className="py-20">
        <LoadingState message="Loading agent workspace metrics & queue..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Support Desk Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Agent Workspace: {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Prioritize SLA deadlines, pick unassigned requests from the queue, and document resolution steps.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            to="/agent/queue"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/15 hover:shadow-blue-500/25"
          >
            <Inbox className="w-4 h-4" />
            <span>View Ticket Queue</span>
          </Link>
        </div>
      </div>

      {/* SLA Breach Alert Banner */}
      {(stats?.overdue || 0) > 0 && (
        <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/80 text-rose-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700 flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">
                Attention Required: {stats.overdue} {stats.overdue === 1 ? "ticket is" : "tickets are"} overdue or close to SLA deadline!
              </p>
              <p className="text-xs text-rose-700/90 mt-0.5">
                Review high-priority issues immediately to maintain operational compliance.
              </p>
            </div>
          </div>
          <Link
            to="/agent/assigned?priority=Critical"
            className="text-xs font-bold text-rose-800 hover:text-rose-950 underline whitespace-nowrap ml-11 sm:ml-0"
          >
            Review Overdue Tickets &rarr;
          </Link>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned to Me"
          value={stats?.assigned || 0}
          icon={UserCheck}
          color="blue"
          subtext="Under your resolution"
        />
        <StatCard
          title="Unassigned Queue"
          value={stats?.unassigned || 0}
          icon={Inbox}
          color="amber"
          subtext="Available to claim"
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress || 0}
          icon={Clock}
          color="purple"
          subtext="Actively troubleshooting"
        />
        <StatCard
          title="Resolved by Team"
          value={stats?.resolved || 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Successfully resolved tickets"
        />
      </div>

      {/* 2-Column Split: Assigned Tickets + Unassigned Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned to Me Preview */}
        <div className="card-white overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">My Assigned Tickets</h2>
              <p className="text-xs text-slate-500">Tickets awaiting your action or update</p>
            </div>
            <Link
              to="/agent/assigned"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {assignedTickets.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={UserCheck}
                title="Your queue is clear!"
                description="You currently don't have any assigned tickets. Grab one from the queue to start assisting."
                actionLabel="Explore Queue"
                actionLink="/agent/queue"
              />
            </div>
          ) : (
            <TicketTable tickets={assignedTickets} showAssignee={false} />
          )}
        </div>

        {/* Unassigned Queue Preview */}
        <div className="card-white overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Unassigned Queue</h2>
              <p className="text-xs text-slate-500">Incoming tickets ready for pickup</p>
            </div>
            <Link
              to="/agent/queue"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {unassignedTickets.length === 0 ? (
            <div className="py-10">
              <EmptyState
                icon={Inbox}
                title="Queue is empty!"
                description="All incoming support requests have been picked up. Great team coverage!"
              />
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {unassignedTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        #{ticket.ticket_number}
                      </span>
                      <PriorityBadge priority={ticket.priority} size="sm" />
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                        {getCategoryIcon(ticket.category)}
                        {ticket.category}
                      </span>
                    </div>

                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="text-xs font-bold text-slate-900 hover:text-blue-600 truncate block leading-snug"
                    >
                      {ticket.title}
                    </Link>

                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Requester: <strong className="text-slate-600 font-medium">{ticket.creator?.full_name}</strong> &bull; {new Date(ticket.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <button
                    onClick={() => handleClaimTicket(ticket.id, ticket.ticket_number)}
                    disabled={claimingId === ticket.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-all whitespace-nowrap disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{claimingId === ticket.id ? "Claiming..." : "Claim"}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
