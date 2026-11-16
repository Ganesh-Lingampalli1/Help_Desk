export const ROLES = {
  EMPLOYEE: "employee",
  AGENT: "agent",
  ADMIN: "admin",
};

export const TICKET_STATUSES = [
  "Open",
  "Assigned",
  "In Progress",
  "Pending",
  "Resolved",
  "Closed",
];

export const TICKET_PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

export const TICKET_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Account Access",
  "Other",
];

export const STATUS_COLORS = {
  Open: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Assigned: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    dot: "bg-purple-500",
  },
  "In Progress": {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  Pending: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    dot: "bg-orange-500",
  },
  Resolved: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  Closed: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-300",
    dot: "bg-slate-500",
  },
};

export const PRIORITY_COLORS = {
  Low: {
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    badge: "bg-slate-100 text-slate-700",
  },
  Medium: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  High: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
  },
  Critical: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
};

export const SLA_HOURS = {
  Low: 48,
  Medium: 24,
  High: 8,
  Critical: 4,
};
