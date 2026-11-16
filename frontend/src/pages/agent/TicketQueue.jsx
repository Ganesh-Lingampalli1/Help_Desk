import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Inbox, RefreshCw, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../api/tickets";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import SearchBar from "../../components/common/SearchBar";
import FilterPanel from "../../components/common/FilterPanel";
import Pagination from "../../components/common/Pagination";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";

export const TicketQueue = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    priority: "",
    category: "",
    search: "",
    sort_by: "created_at",
    sort_order: "asc", // FIFO for queue
  });
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const fetchQueue = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page,
          per_page: pagination.per_page,
          unassigned: "true",
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
        toast.error("Failed to load ticket queue.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  useEffect(() => {
    fetchQueue(1);
  }, [filters]);

  const handleClaim = async (ticketId, ticketNum) => {
    setClaimingId(ticketId);
    try {
      await ticketsApi.assignTicket(ticketId, { agent_id: user.id });
      toast.success(`Ticket #${ticketNum} claimed and assigned to you!`);
      // Refresh current page
      fetchQueue(pagination.page);
    } catch (err) {
      toast.error("Failed to claim ticket.");
    } finally {
      setClaimingId(null);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      priority: "",
      category: "",
      search: "",
      sort_by: "created_at",
      sort_order: "asc",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 mb-1.5">
            <Inbox className="w-3.5 h-3.5" />
            <span>Unassigned Queue</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support Ticket Queue</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Incoming unassigned customer tickets waiting for agent pickup
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchQueue(pagination.page)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh queue"
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
          placeholder="Search unassigned tickets by #, title, or user name..."
        />

        <FilterPanel
          filters={filters}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
          showStatusFilter={false}
          showAssigneeFilter={false}
        />
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading unassigned tickets..." />
          </div>
        ) : tickets.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Ticket Queue is Empty"
            description={
              filters.search || filters.priority || filters.category
                ? "No unassigned tickets match your filter criteria."
                : "All submitted support requests have been assigned to agents."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Ticket</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Priority</th>
                    <th className="px-5 py-3.5">Requester</th>
                    <th className="px-5 py-3.5">Created</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Ticket title and number */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <Link
                            to={`/tickets/${ticket.id}`}
                            className="font-medium text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                          >
                            {ticket.title}
                          </Link>
                          <span className="font-mono text-xs text-blue-600 mt-0.5">
                            #{ticket.ticket_number}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {ticket.category}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-3.5">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      {/* Requester */}
                      <td className="px-5 py-3.5">
                        <div className="text-xs">
                          <p className="font-medium text-slate-800">{ticket.creator?.full_name}</p>
                          <p className="text-slate-400">{ticket.creator?.email}</p>
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(ticket.created_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleClaim(ticket.id, ticket.ticket_number)}
                          disabled={claimingId === ticket.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{claimingId === ticket.id ? "Claiming..." : "Claim Ticket"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              perPage={pagination.per_page}
              onPageChange={(page) => fetchQueue(page)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TicketQueue;
