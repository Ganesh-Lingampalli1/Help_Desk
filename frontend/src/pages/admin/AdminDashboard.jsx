import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  LifeBuoy,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  UserPlus,
  BarChart3,
  PieChart as PieIcon,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { adminApi } from "../../api/admin";
import { ticketsApi } from "../../api/tickets";
import StatCard from "../../components/common/StatCard";
import TicketTable from "../../components/tickets/TicketTable";
import LoadingState from "../../components/common/LoadingState";

const STATUS_COLORS = {
  Open: "#3B82F6",
  Assigned: "#8B5CF6",
  "In Progress": "#F59E0B",
  Pending: "#EC4899",
  Resolved: "#10B981",
  Closed: "#64748B",
};

export const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const [dashRes, ticketsRes] = await Promise.all([
        adminApi.getDashboard(),
        ticketsApi.getTickets({ per_page: 6, sort_by: "created_at", sort_order: "desc" }),
      ]);
      setDashboardData(dashRes);
      setRecentTickets(ticketsRes.tickets || []);
    } catch {
      toast.error("Failed to load admin dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (isLoading && !dashboardData) {
    return (
      <div className="py-20">
        <LoadingState message="Loading administration intelligence & analytics..." />
      </div>
    );
  }

  const { ticket_metrics = {}, user_metrics = {}, category_distribution = [], status_distribution = [] } =
    dashboardData || {};

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="card-white p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            System Overview & Governance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Monitor organizational SLA compliance, manage user roles, and track enterprise support volume.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10 flex-shrink-0">
          <button
            onClick={fetchDashboard}
            disabled={isLoading}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors shadow-2xs"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-md shadow-blue-500/15 hover:shadow-blue-500/25"
          >
            <UserPlus className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Ticket Volume"
          value={ticket_metrics.total || 0}
          icon={LifeBuoy}
          color="blue"
          subtext="Cumulative requests across all teams"
        />
        <StatCard
          title="Active Open Tickets"
          value={ticket_metrics.open || 0}
          icon={Clock}
          color="amber"
          subtext="In queue or awaiting agent action"
        />
        <StatCard
          title="Overdue / SLA Breached"
          value={ticket_metrics.overdue || 0}
          icon={AlertTriangle}
          color="rose"
          subtext="Tickets currently past deadline"
        />
        <StatCard
          title="Registered Users"
          value={user_metrics.total || 0}
          icon={Users}
          color="purple"
          subtext={`${user_metrics.agents || 0} Agents • ${user_metrics.employees || 0} Employees`}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Volume by Category */}
        <div className="card-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Tickets by IT Category</h2>
              <p className="text-xs text-slate-500">Distribution across technical support domains</p>
            </div>
            <Link
              to="/admin/analytics"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {category_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No ticket category data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={category_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Bar dataKey="count" name="Tickets" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Ticket Status Distribution Pie */}
        <div className="card-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Workflow Status Distribution</h2>
              <p className="text-xs text-slate-500">Current ticket distribution by state</p>
            </div>
            <PieIcon className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {status_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No ticket status data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={status_distribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={50}
                    paddingAngle={3}
                  >
                    {status_distribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Recent System Tickets Table */}
      <div className="card-white overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Recent Organization Tickets</h2>
            <p className="text-xs text-slate-500">Latest tickets submitted across all departments</p>
          </div>
          <Link
            to="/admin/tickets"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Tickets</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <TicketTable tickets={recentTickets} showAssignee={true} />
      </div>
    </div>
  );
};

export default AdminDashboard;
