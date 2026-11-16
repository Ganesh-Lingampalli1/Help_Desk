import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, RefreshCw, LifeBuoy } from "lucide-react";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/tickets";
import TicketTable from "../../components/tickets/TicketTable";
import SearchBar from "../../components/common/SearchBar";
import FilterPanel from "../../components/common/FilterPanel";
import Pagination from "../../components/common/Pagination";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
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
        toast.error("Failed to load your tickets.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  useEffect(() => {
    fetchTickets(1);
  }, [filters]);

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track, update, and manage your technical support requests
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
          <Link
            to="/tickets/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Ticket</span>
          </Link>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              value={filters.search}
              onChange={(val) => handleFilterChange("search", val)}
              placeholder="Search by ticket #, subject, or description..."
            />
          </div>
        </div>

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          showAssigneeFilter={false}
        />
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading your tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No tickets found"
            description={
              filters.search || filters.status || filters.priority || filters.category
                ? "Try adjusting your filters or search terms."
                : "You haven't submitted any support tickets yet."
            }
            actionLabel="Create a Ticket"
            actionLink="/tickets/new"
          />
        ) : (
          <>
            <TicketTable tickets={tickets} showAssignee={true} />
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

export default MyTickets;
