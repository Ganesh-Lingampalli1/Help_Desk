import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Sparkles,
  LifeBuoy,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../api/tickets";
import StatCard from "../../components/common/StatCard";
import TicketTable from "../../components/tickets/TicketTable";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        ticketsApi.getStats(),
        ticketsApi.getTickets({ per_page: 8, sort_by: "created_at", sort_order: "desc" }),
      ]);

      setStats(statsRes.stats);
      setRecentTickets(ticketsRes.tickets || []);
    } catch (err) {
      console.error("Failed to load employee dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredTickets = recentTickets.filter((t) => {
    if (statusFilter === "open") return t.status === "Open" || t.status === "Assigned";
    if (statusFilter === "in_progress") return t.status === "In Progress" || t.status === "Pending";
    if (statusFilter === "resolved") return t.status === "Resolved" || t.status === "Closed";
    return true;
  });

  if (isLoading && !stats) {
    return (
      <div className="py-20">
        <LoadingState message="Loading your support dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="card-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Employee Support Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome back, {user?.full_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Report IT problems, monitor technician assignments, and track resolution timelines in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/15 hover:shadow-blue-500/25"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Support Ticket</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Submitted"
          value={stats?.total || 0}
          icon={Ticket}
          color="blue"
          subtext="Lifetime requests submitted"
        />
        <StatCard
          title="Awaiting Technician"
          value={stats?.open || 0}
          icon={Clock}
          color="amber"
          subtext="In queue for assignment"
        />
        <StatCard
          title="In Progress"
          value={stats?.in_progress || 0}
          icon={TrendingUp}
          color="purple"
          subtext="Technicians actively investigating"
        />
        <StatCard
          title="Successfully Resolved"
          value={stats?.resolved || 0}
          icon={CheckCircle2}
          color="emerald"
          subtext="Ready for user verification"
        />
      </div>

      {/* Recent Tickets Section with Filter Tabs */}
      <div className="card-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Recent Support Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your submitted technical issues & service updates</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Filter Tabs */}
            <div className="inline-flex items-center p-1 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({recentTickets.length})
              </button>
              <button
                onClick={() => setStatusFilter("in_progress")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "in_progress"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("resolved")}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === "resolved"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Resolved
              </button>
            </div>

            <Link
              to="/my-tickets"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors ml-2"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {filteredTickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No support tickets match filter"
            description="When you submit requests for software, hardware, or access, they will be tracked here."
            actionLabel="Create New Ticket"
            actionLink="/tickets/new"
          />
        ) : (
          <TicketTable tickets={filteredTickets} showAssignee={true} />
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
