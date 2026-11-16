import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UserCheck, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../api/tickets";
import TicketTable from "../../components/tickets/TicketTable";
import SearchBar from "../../components/common/SearchBar";
import FilterPanel from "../../components/common/FilterPanel";
import Pagination from "../../components/common/Pagination";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const AssignedTickets = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialPriority = searchParams.get("priority") || "";

  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    status: "",
    priority: initialPriority,
    category: "",
    search: "",
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page,
          per_page: pagination.per_page,
          assigned_to: user?.id,
          ...(filters.status && { status: filters.status }),
          ...(filters.priority && { priority: filters.priority }),
          ...(filters.category && { category: filters.category }),
          ...(filters.search && { search: filters.search }),
          sort_by: filters.sort_by,
          sort_order: filters.sort_order,
        };

        const res = await ticketsApi.getTickets(params);
        setTickets(res.tickets || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toast.error("Failed to load assigned tickets.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.per_page, user?.id]
  );

  useEffect(() => {
    if (user?.id) {
      fetchTickets(1);
    }
  }, [filters, user?.id]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      category: "",
      search: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Assigned to Me</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Active technical issues under your resolution responsibility
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets(pagination.page)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <SearchBar
          value={filters.search}
          onChange={(val) => handleFilterChange("search", val)}
          placeholder="Search assigned tickets by #, title, description, or creator..."
        />

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          showAssigneeFilter={false}
        />
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading your assigned tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={UserCheck}
            title="No tickets assigned"
            description={
              filters.search || filters.status || filters.priority
                ? "No tickets match your filter criteria."
                : "You currently have no tickets assigned. Head to the queue to claim open tickets."
            }
            actionLabel="View Ticket Queue"
            actionLink="/agent/queue"
          />
        ) : (
          <>
            <TicketTable tickets={tickets} showAssignee={false} />
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              perPage={pagination.per_page}
              onPageChange={(page) => fetchTickets(page)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AssignedTickets;
