import React, { useState } from "react";
import { User, Lock, Shield, KeyRound, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";

export const UserProfile = () => {
  const { user } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validatePasswordForm = () => {
    const errs = {};
    if (!passwordForm.current_password) {
      errs.current_password = "Current password is required.";
    }
    if (!passwordForm.new_password) {
      errs.new_password = "New password is required.";
    } else if (passwordForm.new_password.length < 8) {
      errs.new_password = "New password must be at least 8 characters.";
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      errs.confirm_password = "Password confirmation does not match.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      toast.success("Password updated successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update password. Please check your credentials.";
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your personal details, access credentials, and security settings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Info Card */}
        <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 border-2 border-blue-200 text-blue-700 font-extrabold text-2xl flex items-center justify-center">
            {user?.full_name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U"}
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Account Role</span>
              <span className="font-semibold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {user?.role}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              <span className="font-medium text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <span>Change Account Password</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure your account is using a long, random password to stay secure.
            </p>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, current_password: e.target.value })
                }
                placeholder="Enter current password..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.current_password ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.current_password && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.current_password}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new_password: e.target.value })
                }
                placeholder="Minimum 8 characters with numbers & symbols..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.new_password ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.new_password && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.new_password}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                }
                placeholder="Re-type new password..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all ${
                  errors.confirm_password ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
                }`}
              />
              {errors.confirm_password && (
                <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.confirm_password}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPassword}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {isChangingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
