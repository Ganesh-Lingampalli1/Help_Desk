import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { UserCheck, AlertCircle } from "lucide-react";
import { ROLES } from "../../utils/constants";

export const UserModal = ({ isOpen, onClose, user = null, onSave, isSubmitting = false }) => {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: ROLES.EMPLOYEE,
    is_active: true,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        email: user.email || "",
        password: "",
        role: user.role || ROLES.EMPLOYEE,
        is_active: user.is_active ?? true,
      });
    } else {
      setFormData({
        full_name: "",
        email: "",
        password: "",
        role: ROLES.EMPLOYEE,
        is_active: true,
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) {
      errs.full_name = "Full name is required.";
    }
    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    }
    if (!isEditing && (!formData.password || formData.password.length < 6)) {
      errs.password = "Password must be at least 6 characters long.";
    }
    if (isEditing && formData.password && formData.password.length < 6) {
      errs.password = "Password must be at least 6 characters long.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      is_active: formData.is_active,
    };

    if (formData.password) {
      payload.password = formData.password;
    }

    onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit User: ${user.full_name}` : "Create New User Account"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="John Doe"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          {errors.full_name && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.full_name}
            </p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Email Address <span className="text-rose-500">*</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@company.com"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            {isEditing ? "Reset Password (leave blank to keep current)" : "Password *"}
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="••••••••"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Role */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Role <span className="text-rose-500">*</span>
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer capitalize"
          >
            <option value={ROLES.EMPLOYEE}>Employee</option>
            <option value={ROLES.AGENT}>Support Agent</option>
            <option value={ROLES.ADMIN}>Administrator</option>
          </select>
        </div>

        {/* Active Status Toggle (if editing) */}
        {isEditing && (
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">Account Active</span>
                <p className="text-[11px] text-slate-400">
                  Unchecking deactivates user without deleting their ticket history.
                </p>
              </div>
            </label>
          </div>
        )}

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
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create User"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserModal;
