import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  User,
  Shield,
  LifeBuoy,
  MessageSquare,
  Paperclip,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  RotateCcw,
  Check,
  ChevronRight,
  Laptop,
  Code2,
  Wifi,
  KeyRound,
  Lock,
  Calendar,
  Share2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { ticketsApi } from "../../api/tickets";
import { commentsApi } from "../../api/comments";
import StatusBadge from "../../components/common/StatusBadge";
import PriorityBadge from "../../components/common/PriorityBadge";
import LoadingState from "../../components/common/LoadingState";
import Modal from "../../components/common/Modal";
import CommentThread from "../../components/tickets/CommentThread";
import AttachmentList from "../../components/tickets/AttachmentList";
import TicketHistoryList from "../../components/tickets/TicketHistoryList";
import AssignAgentModal from "../../components/admin/AssignAgentModal";
import { TICKET_PRIORITIES } from "../../utils/constants";

export const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("comments");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Status Action Modals
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchTicketDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      const [ticketRes, commentsRes, historyRes] = await Promise.all([
        ticketsApi.getTicket(id),
        commentsApi.getComments(id),
        ticketsApi.getHistory(id),
      ]);

      setTicket(ticketRes.ticket);
      setComments(commentsRes.comments || []);
      setHistory(historyRes.history || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to load ticket details.";
      toast.error(msg);
      if (err.response?.status === 404 || err.response?.status === 403) {
        navigate(-1);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTicketDetails();
  }, [fetchTicketDetails]);

  const handleAddComment = async ({ message, is_internal }) => {
    setIsSubmittingComment(true);
    try {
      await commentsApi.addComment(id, { message, is_internal });
      toast.success(is_internal ? "Internal note posted." : "Comment posted.");
      const commentsRes = await commentsApi.getComments(id);
      setComments(commentsRes.comments || []);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to post comment.";
      toast.error(msg);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus, options = {}) => {
    setIsUpdatingStatus(true);
    try {
      await ticketsApi.updateStatus(id, {
        status: newStatus,
        resolution_notes: options.resolution_notes || null,
        description: options.description || null,
      });

      toast.success(`Ticket status updated to ${newStatus}`);
      fetchTicketDetails();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update ticket status.";
      toast.error(msg);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolutionNotes.trim()) {
      toast.error("Please provide resolution notes before resolving this ticket.");
      return;
    }
    await handleStatusChange("Resolved", { resolution_notes: resolutionNotes });
    setIsResolveModalOpen(false);
    setResolutionNotes("");
  };

  const handleConfirmReopen = async () => {
    if (!reopenReason.trim()) {
      toast.error("Please provide a reason for reopening this ticket.");
      return;
    }
    await handleStatusChange("In Progress", { description: `Reopened: ${reopenReason}` });
    setIsReopenModalOpen(false);
    setReopenReason("");
  };

  const handleClaimTicket = async () => {
    try {
      await ticketsApi.assignTicket(id, { agent_id: user.id });
      toast.success("Ticket claimed and assigned to you!");
      fetchTicketDetails();
    } catch {
      toast.error("Failed to assign ticket.");
    }
  };

  const handlePriorityChange = async (newPriority) => {
    try {
      await ticketsApi.updateTicket(id, { priority: newPriority });
      toast.success(`Priority updated to ${newPriority}`);
      fetchTicketDetails();
    } catch {
      toast.error("Failed to update priority.");
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Hardware":
        return <Laptop className="w-4 h-4 text-blue-600" />;
      case "Software":
        return <Code2 className="w-4 h-4 text-purple-600" />;
      case "Network":
        return <Wifi className="w-4 h-4 text-emerald-600" />;
      case "Account Access":
        return <KeyRound className="w-4 h-4 text-amber-600" />;
      default:
        return <LifeBuoy className="w-4 h-4 text-slate-500" />;
    }
  };

  if (isLoading && !ticket) {
    return (
      <div className="py-24">
        <LoadingState message="Loading ticket details & conversations..." />
      </div>
    );
  }

  if (!ticket) return null;

  const isStaff = user?.role === "agent" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const assignedAgent = ticket.assigned_agent || ticket.assignee;
  const isOverdue = ticket.is_overdue;
  const slaDate = ticket.due_at ? new Date(ticket.due_at) : null;
  const isCompleted = ticket.status === "Resolved" || ticket.status === "Closed";

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            to={
              user?.role === "admin"
                ? "/admin/tickets"
                : user?.role === "agent"
                ? "/agent/assigned"
                : "/my-tickets"
            }
            className="hover:text-blue-600 font-medium"
          >
            Tickets
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono font-semibold text-blue-600">#{ticket.ticket_number}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-800 font-semibold truncate max-w-xs">{ticket.title}</span>
        </div>

        <button
          onClick={fetchTicketDetails}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          title="Refresh ticket"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Ticket Header & Action Bar */}
      <div className="card-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
              #{ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} size="md" />
            <PriorityBadge priority={ticket.priority} size="md" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
              {getCategoryIcon(ticket.category)}
              <span>{ticket.category}</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug">
            {ticket.title}
          </h1>

          <p className="text-xs text-slate-500 flex items-center gap-2">
            <span>Opened by <strong className="text-slate-700 font-medium">{ticket.creator?.full_name}</strong></span>
            <span>&bull;</span>
            <span>{new Date(ticket.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</span>
          </p>
        </div>

        {/* Workflow Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Claim Ticket for Agents */}
          {!assignedAgent && user?.role === "agent" && ticket.status !== "Closed" && (
            <button
              onClick={handleClaimTicket}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Claim Ticket</span>
            </button>
          )}

          {/* Admin Assign Button */}
          {isAdmin && ticket.status !== "Closed" && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{assignedAgent ? "Reassign Agent" : "Assign Agent"}</span>
            </button>
          )}

          {/* Staff Status Transitions */}
          {isStaff && ticket.status !== "Closed" && ticket.status !== "Resolved" && (
            <>
              {ticket.status !== "In Progress" && (
                <button
                  onClick={() => handleStatusChange("In Progress")}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  Start Work (In Progress)
                </button>
              )}

              {ticket.status !== "Pending" && (
                <button
                  onClick={() => handleStatusChange("Pending")}
                  disabled={isUpdatingStatus}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all disabled:opacity-50"
                >
                  Mark Pending
                </button>
              )}

              <button
                onClick={() => setIsResolveModalOpen(true)}
                disabled={isUpdatingStatus}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Resolve Ticket</span>
              </button>
            </>
          )}

          {/* Close Ticket */}
          {isStaff && ticket.status === "Resolved" && (
            <button
              onClick={() => handleStatusChange("Closed")}
              disabled={isUpdatingStatus}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              Close Ticket
            </button>
          )}

          {/* Reopen Ticket */}
          {(ticket.status === "Resolved" || (ticket.status === "Closed" && isStaff)) && (
            <button
              onClick={() => setIsReopenModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details / Conversation + Right Inspector Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Issue Description, Resolution Banner, Tabbed Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Description Card */}
          <div className="card-white p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detailed Issue Description
              </span>
              <span className="text-xs text-slate-400">
                Created on {new Date(ticket.created_at).toLocaleDateString([], { dateStyle: "medium" })}
              </span>
            </div>
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-normal">
              {ticket.description}
            </div>
          </div>

          {/* Resolution Details Card */}
          {isCompleted && ticket.resolution_notes && (
            <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/60 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Resolution Solution & Notes</span>
                {ticket.resolved_at && (
                  <span className="text-xs font-normal text-emerald-700 ml-auto">
                    Resolved at {new Date(ticket.resolved_at).toLocaleString()}
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-950 leading-relaxed whitespace-pre-wrap pl-7">
                {ticket.resolution_notes}
              </p>
            </div>
          )}

          {/* Tabbed Activity Center */}
          <div className="card-white overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                onClick={() => setActiveTab("comments")}
                className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
                  activeTab === "comments"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversation Thread ({comments.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("attachments")}
                className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
                  activeTab === "attachments"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Paperclip className="w-4 h-4" />
                <span>Attachments ({ticket.attachments?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab("history")}
                className={`flex-1 py-3 px-4 text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
                  activeTab === "history"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-4 h-4" />
                <span>Audit History ({history.length})</span>
              </button>
            </div>

            <div className="p-6">
              {activeTab === "comments" && (
                <CommentThread
                  comments={comments}
                  onAddComment={handleAddComment}
                  isSubmitting={isSubmittingComment}
                />
              )}

              {activeTab === "attachments" && (
                <AttachmentList
                  ticketId={ticket.id}
                  attachments={ticket.attachments || []}
                  onUploadSuccess={fetchTicketDetails}
                />
              )}

              {activeTab === "history" && <TicketHistoryList history={history} />}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Metadata Inspector & SLA Clock */}
        <div className="space-y-5">
          {/* SLA Status Card */}
          <div
            className={`p-5 rounded-2xl border shadow-xs space-y-3 ${
              isOverdue
                ? "bg-rose-50/80 border-rose-200 text-rose-900"
                : isCompleted
                ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">Service Level Agreement</span>
              {isOverdue ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  SLA Breached
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Target Met
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Active Within SLA
                </span>
              )}
            </div>

            <div className="text-xs space-y-2 pt-1 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Target Resolution:</span>
                <span className="font-semibold text-slate-900 font-mono">
                  {slaDate ? slaDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Priority Level:</span>
                <span className="font-semibold text-slate-900">{ticket.priority}</span>
              </div>
            </div>
          </div>

          {/* Ticket Inspector Panel */}
          <div className="card-white p-5 space-y-5">
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2.5">
              Ticket Properties
            </h3>

            <div className="space-y-4 text-xs">
              {/* Category */}
              <div>
                <span className="text-slate-400 block mb-1 uppercase font-semibold text-[10px] tracking-wider">
                  Issue Category
                </span>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  {getCategoryIcon(ticket.category)}
                  <span className="font-semibold text-slate-800">{ticket.category}</span>
                </div>
              </div>

              {/* Priority Selector */}
              <div>
                <span className="text-slate-400 block mb-1 uppercase font-semibold text-[10px] tracking-wider">
                  Priority
                </span>
                {isStaff && ticket.status !== "Closed" ? (
                  <select
                    value={ticket.priority}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold input-focus cursor-pointer"
                  >
                    {TICKET_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p} Priority
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2">
                    <PriorityBadge priority={ticket.priority} size="md" />
                  </div>
                )}
              </div>

              {/* Assigned Agent Card */}
              <div>
                <span className="text-slate-400 block mb-1 uppercase font-semibold text-[10px] tracking-wider">
                  Assigned Support Agent
                </span>
                {assignedAgent ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {assignedAgent.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{assignedAgent.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{assignedAgent.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs">Unassigned</p>
                      <p className="text-[10px] text-amber-700/80">Awaiting technician pickup</p>
                    </div>
                    {user?.role === "agent" && (
                      <button
                        onClick={handleClaimTicket}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Requester Profile Card */}
              <div>
                <span className="text-slate-400 block mb-1 uppercase font-semibold text-[10px] tracking-wider">
                  Requester / Employee
                </span>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                    {ticket.creator?.full_name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{ticket.creator?.full_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{ticket.creator?.email}</p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Created:</span>
                  <span className="text-slate-600 font-medium">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                </div>
                {ticket.updated_at && (
                  <div className="flex justify-between">
                    <span>Last Updated:</span>
                    <span className="text-slate-600 font-medium">
                      {new Date(ticket.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resolution Notes Modal */}
      {isResolveModalOpen && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title="Resolve Support Ticket"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Record a clear explanation of how this problem was diagnosed and resolved for the employee and audit trail.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Resolution Notes <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="e.g. Restarted background print spooler service and flushed local cache..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 input-focus"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResolveModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reopen Ticket Modal */}
      {isReopenModalOpen && (
        <Modal
          isOpen={isReopenModalOpen}
          onClose={() => setIsReopenModalOpen(false)}
          title="Reopen Support Ticket"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Explain why this issue requires further technician assistance. The ticket will move back into In Progress.
            </p>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Reason for Reopening <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. The issue recurred upon restarting the operating system..."
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 input-focus"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                disabled={isUpdatingStatus}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                Reopen Ticket
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin Assign Agent Modal */}
      {isAssignModalOpen && (
        <AssignAgentModal
          ticket={ticket}
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={fetchTicketDetails}
        />
      )}
    </div>
  );
};

export default TicketDetail;
