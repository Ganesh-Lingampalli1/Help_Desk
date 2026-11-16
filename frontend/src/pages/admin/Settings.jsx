import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Clock,
  HardDrive,
  FileText,
  Activity,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import apiClient from "../../api/client";
import { SLA_HOURS, TICKET_CATEGORIES, TICKET_PRIORITIES } from "../../utils/constants";

export const Settings = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await apiClient.get("/health");
      setHealthStatus(res.data);
    } catch (err) {
      setHealthStatus({ status: "error", message: "Failed to connect to backend server" });
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Configuration & Policies</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Global service level agreements, security parameters, and operational configurations
        </p>
      </div>

      {/* Backend Health Status */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Backend API Health Status</h3>
              <p className="text-xs text-slate-500">Connected to Flask REST API server (Port 5000)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {healthStatus?.status === "healthy" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Operational & Healthy
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                {healthStatus?.status || "Checking..."}
              </span>
            )}
            <button
              onClick={checkHealth}
              disabled={checkingHealth}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              title="Re-check health"
            >
              <RefreshCw className={`w-4 h-4 ${checkingHealth ? "animate-spin text-blue-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* SLA Target Policy Reference */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>SLA Target Response & Resolution Windows</span>
        </div>
        <p className="text-xs text-slate-500">
          When a ticket is created, its SLA target resolution timestamp is automatically calculated based on priority level.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Critical Priority</span>
            <div className="text-2xl font-extrabold text-rose-800 mt-2 font-mono">
              {SLA_HOURS.Critical} Hours
            </div>
            <p className="text-[11px] text-rose-600/90 mt-1">
              Production outage, security breach, total service shutdown.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">High Priority</span>
            <div className="text-2xl font-extrabold text-amber-800 mt-2 font-mono">
              {SLA_HOURS.High} Hours
            </div>
            <p className="text-[11px] text-amber-600/90 mt-1">
              Major functionality blocked, business operations heavily impaired.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Medium Priority</span>
            <div className="text-2xl font-extrabold text-blue-800 mt-2 font-mono">
              {SLA_HOURS.Medium} Hours
            </div>
            <p className="text-[11px] text-blue-600/90 mt-1">
              Standard technical issue with reasonable temporary workaround.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Low Priority</span>
            <div className="text-2xl font-extrabold text-slate-800 mt-2 font-mono">
              {SLA_HOURS.Low} Hours
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              General inquiries, minor cosmetic errors, routine account adjustments.
            </p>
          </div>
        </div>
      </div>

      {/* Security & Authentication Policies */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Security & Governance Policies</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5">
            <span className="font-semibold text-slate-800">JWT Token Expiration</span>
            <p className="text-slate-500">Access tokens expire after 24 hours. Rotation required upon expiration.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5">
            <span className="font-semibold text-slate-800">Password Hashing</span>
            <p className="text-slate-500">PBKDF2-SHA256 with cryptographic salt via Werkzeug security library.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5">
            <span className="font-semibold text-slate-800">Rate Limiting</span>
            <p className="text-slate-500">5 requests per minute limit on public login and registration endpoints.</p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/60 space-y-1.5">
            <span className="font-semibold text-slate-800">Role-Based Access Control (RBAC)</span>
            <p className="text-slate-500">Server-side decorators protect each REST endpoint. No client-side bypass possible.</p>
          </div>
        </div>
      </div>

      {/* File Upload Configurations */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-semibold border-b border-slate-100 pb-3">
          <HardDrive className="w-5 h-5 text-emerald-600" />
          <span>File Storage & Attachment Restrictions</span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Maximum Upload File Size:</span>
            <span className="font-semibold text-slate-800">5 MB per file</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Allowed File Formats:</span>
            <span className="font-semibold text-slate-800 font-mono">.png, .jpg, .jpeg, .gif, .pdf, .docx, .txt, .zip</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Storage Protection:</span>
            <span className="font-semibold text-slate-800">UUIDv4 randomized storage keys, MIME type validation</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-500">Access Authorization:</span>
            <span className="font-semibold text-slate-800">Downloads restricted to ticket creator, assigned agent, and admins</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
