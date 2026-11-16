import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, LifeBuoy, Info, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { ticketsApi } from "../../api/tickets";
import { attachmentsApi } from "../../api/attachments";
import TicketForm from "../../components/tickets/TicketForm";

export const CreateTicket = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData, attachment) => {
    setIsSubmitting(true);
    try {
      // 1. Create ticket
      const res = await ticketsApi.createTicket(formData);
      const ticket = res.ticket;

      // 2. Upload attachment if present
      if (attachment) {
        try {
          await attachmentsApi.upload(ticket.id, attachment);
        } catch (uploadErr) {
          toast.error("Ticket created, but attachment upload failed. You can re-upload on the ticket page.");
        }
      }

      toast.success(`Ticket #${ticket.ticket_number} submitted successfully!`);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create ticket. Please check your inputs.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/my-tickets"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Back to Tickets"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Support Ticket</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Submit your technical issue or service request to the IT Support Team
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form container */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <TicketForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </div>

        {/* Sidebar Info & SLA Guidelines */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center gap-2 text-blue-600">
              <LifeBuoy className="w-5 h-5" />
              <h3 className="font-semibold text-slate-900 text-sm">Priority & SLAs</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tickets are routed and handled based on system impact and priority level.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 rounded-lg border border-rose-100 bg-rose-50/40">
                <div className="font-semibold text-rose-700 flex items-center justify-between">
                  <span>Critical</span>
                  <span className="font-mono">4 Hours</span>
                </div>
                <p className="text-rose-600/90 text-[11px] mt-0.5">
                  Complete outage affecting entire department or core production services.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-amber-100 bg-amber-50/40">
                <div className="font-semibold text-amber-700 flex items-center justify-between">
                  <span>High</span>
                  <span className="font-mono">8 Hours</span>
                </div>
                <p className="text-amber-600/90 text-[11px] mt-0.5">
                  Severely degraded performance with no immediate workaround.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-blue-100 bg-blue-50/40">
                <div className="font-semibold text-blue-700 flex items-center justify-between">
                  <span>Medium</span>
                  <span className="font-mono">24 Hours</span>
                </div>
                <p className="text-blue-600/90 text-[11px] mt-0.5">
                  Standard issues affecting normal workflow with workaround available.
                </p>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <div className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Low</span>
                  <span className="font-mono">48 Hours</span>
                </div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  General inquiries, minor cosmetic bugs, or routine access setup.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Helpful Tips</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px] text-slate-500">
              <li>Include exact error messages and full screenshots.</li>
              <li>Mention the operating system and browser version if applicable.</li>
              <li>You will receive in-app notifications on all agent replies.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
