import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Ticket,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Headphones,
  Briefcase,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || isSubmitting) return;

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate(from, { replace: true });
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen bg-grid-pattern flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-3 group">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Ticket className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">
              HelpDesk
            </h1>
            <span className="text-[11px] font-semibold text-blue-600">Enterprise Edition</span>
          </div>
        </Link>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mt-2">
          Sign in to your portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your credentials to manage tickets, queues, and team SLA compliance
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 p-6 sm:p-8">
          {/* Quick Demo Credentials Panel */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Select Demo Role
              </span>
              <span className="text-[10px] text-slate-400">Click card to autofill</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() => handleDemoFill("admin@helpdesk.com", "Admin@123456")}
                className={`p-2.5 rounded-xl border text-left transition-all hover:border-purple-300 hover:bg-purple-50/50 ${
                  email === "admin@helpdesk.com"
                    ? "border-purple-500 bg-purple-50/80 ring-2 ring-purple-500/20"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-purple-700">Administrator</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <p className="text-[10px] text-slate-500 truncate">System & Users</p>
              </button>

              {/* Agent Card */}
              <button
                type="button"
                onClick={() => handleDemoFill("agent.sarah@helpdesk.com", "Agent@123456")}
                className={`p-2.5 rounded-xl border text-left transition-all hover:border-blue-300 hover:bg-blue-50/50 ${
                  email === "agent.sarah@helpdesk.com"
                    ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-blue-700">Support Agent</span>
                  <Headphones className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <p className="text-[10px] text-slate-500 truncate">Queue & Resolve</p>
              </button>

              {/* Employee Card */}
              <button
                type="button"
                onClick={() => handleDemoFill("employee.david@company.com", "Employee@123456")}
                className={`p-2.5 rounded-xl border text-left transition-all hover:border-slate-400 hover:bg-slate-100/50 ${
                  email === "employee.david@company.com"
                    ? "border-slate-600 bg-slate-100 ring-2 ring-slate-400/20"
                    : "border-slate-200 bg-slate-50/60"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Employee</span>
                  <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <p className="text-[10px] text-slate-500 truncate">Submit & Track</p>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 input-focus"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Min 8 characters</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 input-focus"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-500/15 disabled:opacity-50"
            >
              <span>{isSubmitting ? "Signing in..." : "Sign In to HelpDesk"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Don't have an account yet?</span>
            <Link to="/register" className="font-bold text-blue-600 hover:text-blue-800">
              Create an account &rarr;
            </Link>
          </div>
        </div>

        {/* Security & Compliance Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            PBKDF2 Hashing
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            24h JWT Sessions
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Full RBAC Protection
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
