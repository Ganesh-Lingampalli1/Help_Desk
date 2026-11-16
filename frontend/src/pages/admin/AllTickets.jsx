import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, RefreshCw, UserPlus, Filter } from "lucide-react";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/tickets";
import { adminApi } from "../../api/admin";
import TicketTable from "../../components/tickets/TicketTable";
import SearchBar from "../../components/common/SearchBar";
import FilterPanel from "../../components/common/FilterPanel";
import Pagination from "../../components/common/Pagination";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import AssignAgentModal from "../../components/admin/AssignAgentModal";

export const AllTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
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
    assigned_to: "",
    search: "",
    sort_by: "created_at",
    sort_order: "desc",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Assignment modal state
  const [assigningTicket, setAssigningTicket] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const fetchAgents = async () => {
    try {
      const res = await adminApi.getAssignableAgents();
      setAgents(res.agents || []);
    } catch (err) {
      console.error("Failed to load agents list", err);
    }
  };

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
          ...(filters.assigned_to && { assigned_to: filters.assigned_to }),
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
        toast.error("Failed to load system tickets.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  useEffect(() => {
    fetchAgents();
  }, []);

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
      assigned_to: "",
      search: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
  };

  const handleOpenAssignModal = (ticket) => {
    setAssigningTicket(ticket);
    setIsAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    fetchTickets(pagination.page);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">All System Tickets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Global management, triage, and agent assignment across all organizations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTickets(pagination.page)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh list"
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
          placeholder="Search by ticket #, subject, requester, or keywords..."
        />

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          showAssigneeFilter={true}
          agents={agents}
        />
      </div>

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading ticket records..." />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No tickets found"
            description={
              filters.search || filters.status || filters.priority || filters.category || filters.assigned_to
                ? "No tickets match your specific filter criteria."
                : "No tickets have been created in the system yet."
            }
          />
        ) : (
          <>
            <TicketTable
              tickets={tickets}
              showAssignee={true}
              onAssignClick={handleOpenAssignModal}
            />
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

      {/* Reassign Agent Modal */}
      {isAssignModalOpen && assigningTicket && (
        <AssignAgentModal
          ticket={assigningTicket}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
};

export default AllTickets;
