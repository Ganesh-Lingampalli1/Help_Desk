import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  BarChart3,
  PieChart as PieIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import toast from "react-hot-toast";
import { adminApi } from "../../api/admin";
import LoadingState from "../../components/common/LoadingState";
import StatCard from "../../components/common/StatCard";

const STATUS_COLORS = {
  Open: "#3B82F6",
  Assigned: "#8B5CF6",
  "In Progress": "#F59E0B",
  Pending: "#EC4899",
  Resolved: "#10B981",
  Closed: "#64748B",
};

const PRIORITY_COLORS = {
  Low: "#10B981",
  Medium: "#3B82F6",
  High: "#F59E0B",
  Critical: "#EF4444",
};

export const AnalyticsReports = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setData(res);
    } catch (err) {
      toast.error("Failed to load analytics metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (isLoading && !data) {
    return (
      <div className="py-16">
        <LoadingState message="Generating real-time reports and analytics..." />
      </div>
    );
  }

  const {
    sla_metrics = {},
    tickets_over_time = [],
    category_distribution = [],
    priority_distribution = [],
    status_distribution = [],
    agent_workload = [],
  } = data || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational intelligence, SLA compliance rate, and agent resolution throughput
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAnalytics}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* SLA Compliance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="SLA Compliance Rate"
          value={`${sla_metrics.compliance_rate || 0}%`}
          icon={ShieldCheck}
          color="emerald"
          subtext="Tickets resolved within SLA"
        />
        <StatCard
          title="Overdue / Breached"
          value={sla_metrics.overdue_count || 0}
          icon={AlertTriangle}
          color="rose"
          subtext="Unresolved tickets past deadline"
        />
        <StatCard
          title="Avg Resolution Time"
          value={sla_metrics.avg_resolution_hours ? `${sla_metrics.avg_resolution_hours} hrs` : "N/A"}
          icon={Clock}
          color="blue"
          subtext="From ticket creation to resolution"
        />
        <StatCard
          title="Active Support Agents"
          value={agent_workload.length}
          icon={Users}
          color="purple"
          subtext="Currently handling tickets"
        />
      </div>

      {/* Row 1 Charts: Trend & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Ticket Creation Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">7-Day Ticket Volume Trend</h2>
              <p className="text-xs text-slate-500">Daily volume of newly submitted support requests</p>
            </div>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>

          <div className="h-64 w-full">
            {tickets_over_time.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No recent timeline data recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={tickets_over_time} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Tickets Created"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563EB" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Tickets by Priority</h2>
              <p className="text-xs text-slate-500">Volume by criticality level</p>
            </div>
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>

          <div className="h-64 w-full">
            {priority_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No priority data recorded
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priority_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]}>
                    {priority_distribution.map((entry) => (
                      <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority] || "#3B82F6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Status Breakdown & Agent Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Workflow Status Distribution</h2>
              <p className="text-xs text-slate-500">Current active states</p>
            </div>
            <PieIcon className="w-5 h-5 text-emerald-600" />
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {status_distribution.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No status data available
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
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {status_distribution.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94A3B8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agent Workload Table */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Agent Workload & Throughput</h2>
              <p className="text-xs text-slate-500">Assigned volume and resolution metrics per agent</p>
            </div>
            <Users className="w-5 h-5 text-purple-600" />
          </div>

          <div className="overflow-x-auto">
            {agent_workload.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active support agents or assigned tickets recorded
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Agent</th>
                    <th className="px-3 py-2.5 text-center">Assigned</th>
                    <th className="px-3 py-2.5 text-center">Resolved</th>
                    <th className="px-3 py-2.5 text-right">Completion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agent_workload.map((agent) => {
                    const total = (agent.assigned || 0) + (agent.resolved || 0);
                    const rate = total > 0 ? Math.round(((agent.resolved || 0) / total) * 100) : 0;
                    return (
                      <tr key={agent.id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {agent.full_name}
                          <span className="block text-[10px] text-slate-400">{agent.email}</span>
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-amber-600">
                          {agent.assigned || 0}
                        </td>
                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">
                          {agent.resolved || 0}
                        </td>
                        <td className="px-3 py-2.5 text-right font-medium text-slate-700">
                          {rate}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReports;
