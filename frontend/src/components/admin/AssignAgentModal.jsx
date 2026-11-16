import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { adminApi } from "../../api/admin";
import { UserCheck } from "lucide-react";

export const AssignAgentModal = ({ isOpen, onClose, ticket, onAssign, isSubmitting = false }) => {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedAgentId(ticket?.assigned_to || "");
      const fetchAgents = async () => {
        try {
          setIsLoading(true);
          const res = await adminApi.getAssignableAgents();
          if (res.success) {
            setAgents(res.agents || []);
          }
        } catch {
          // Ignored
        } finally {
          setIsLoading(false);
        }
      };
      fetchAgents();
    }
  }, [isOpen, ticket]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(selectedAgentId ? Number(selectedAgentId) : null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Support Agent">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs text-slate-500 mb-3">
            Assign ticket <strong className="text-slate-800">{ticket?.ticket_number}</strong> to a
            technical support specialist.
          </p>

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Select Agent
          </label>
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            disabled={isLoading || isSubmitting}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
          >
            <option value="">Unassigned (Return to Queue)</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.full_name} ({agent.role}) - {agent.email}
              </option>
            ))}
          </select>
        </div>

        <div className="pt-3 flex justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {isSubmitting ? "Assigning..." : "Confirm Assignment"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssignAgentModal;
