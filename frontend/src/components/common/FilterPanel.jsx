import React from "react";
import { Filter, RotateCcw } from "lucide-react";
import { TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES } from "../../utils/constants";

export const FilterPanel = ({
  filters,
  onFilterChange,
  onReset,
  showAssigneeFilter = false,
  assignees = [],
}) => {
  const hasActiveFilters =
    filters.status ||
    filters.priority ||
    filters.category ||
    filters.assigned_to;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
        <Filter className="w-3.5 h-3.5" />
        <span>Filters:</span>
      </div>

      {/* Status */}
      <select
        value={filters.status || ""}
        onChange={(e) => onFilterChange("status", e.target.value)}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
      >
        <option value="">All Statuses</option>
        {TICKET_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {/* Priority */}
      <select
        value={filters.priority || ""}
        onChange={(e) => onFilterChange("priority", e.target.value)}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
      >
        <option value="">All Priorities</option>
        {TICKET_PRIORITIES.map((priority) => (
          <option key={priority} value={priority}>
            {priority}
          </option>
        ))}
      </select>

      {/* Category */}
      <select
        value={filters.category || ""}
        onChange={(e) => onFilterChange("category", e.target.value)}
        className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
      >
        <option value="">All Categories</option>
        {TICKET_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      {/* Assignee (Agents & Admins view) */}
      {showAssigneeFilter && (
        <select
          value={filters.assigned_to || ""}
          onChange={(e) => onFilterChange("assigned_to", e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:outline-none focus:border-blue-600 cursor-pointer transition-colors"
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          <option value="me">Assigned to Me</option>
          {assignees.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name}
            </option>
          ))}
        </select>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
