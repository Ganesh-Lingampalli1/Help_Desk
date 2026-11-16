import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  RefreshCw,
  Edit2,
  UserX,
  UserCheck,
  Shield,
  Search,
  Filter,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "../../api/admin";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import LoadingState from "../../components/common/LoadingState";
import EmptyState from "../../components/common/EmptyState";
import UserModal from "../../components/admin/UserModal";
import Modal from "../../components/common/Modal";

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
  });
  const [filters, setFilters] = useState({
    role: "",
    is_active: "",
    search: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // User modal (Create / Edit)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Toggle active confirmation modal
  const [deactivateUser, setDeactivateUser] = useState(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

  const fetchUsers = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      try {
        const params = {
          page,
          per_page: pagination.per_page,
          ...(filters.role && { role: filters.role }),
          ...(filters.is_active !== "" && { is_active: filters.is_active }),
          ...(filters.search && { search: filters.search }),
        };

        const res = await adminApi.getUsers(params);
        setUsers(res.users || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } catch (err) {
        toast.error("Failed to load user accounts.");
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.per_page]
  );

  useEffect(() => {
    fetchUsers(1);
  }, [filters]);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleToggleActiveConfirm = async () => {
    if (!deactivateUser) return;
    setIsTogglingStatus(true);
    const newStatus = !deactivateUser.is_active;

    try {
      await adminApi.updateUser(deactivateUser.id, { is_active: newStatus });
      toast.success(
        `User ${deactivateUser.full_name} has been ${newStatus ? "activated" : "deactivated"} successfully.`
      );
      setDeactivateUser(null);
      fetchUsers(pagination.page);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update user status.";
      toast.error(msg);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" />
            Admin
          </span>
        );
      case "agent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Support Agent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            Employee
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Provision user accounts, assign roles, and manage system access permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(pagination.page)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh users"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-blue-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <SearchBar
              value={filters.search}
              onChange={(val) => setFilters((prev) => ({ ...prev, search: val }))}
              placeholder="Search by name or email..."
            />
          </div>

          <div>
            <select
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="employee">Employee</option>
              <option value="agent">Support Agent</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters((prev) => ({ ...prev, is_active: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all cursor-pointer"
            >
              <option value="">All Account Statuses</option>
              <option value="true">Active Only</option>
              <option value="false">Deactivated Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <LoadingState message="Loading user directory..." />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="No user accounts match your search or filter settings."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Joined Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Email */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                            {u.full_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{u.full_name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-5 py-3.5">{getRoleBadge(u.role)}</td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(u.created_at).toLocaleDateString([], {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeactivateUser(u)}
                            className={`p-1.5 rounded-md transition-colors ${
                              u.is_active
                                ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={u.is_active ? "Deactivate User" : "Activate User"}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
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
              onPageChange={(page) => fetchUsers(page)}
            />
          </>
        )}
      </div>

      {/* User Create/Edit Modal */}
      {isUserModalOpen && (
        <UserModal
          user={selectedUser}
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          onSuccess={() => fetchUsers(pagination.page)}
        />
      )}

      {/* Deactivate/Activate Confirmation Modal */}
      {deactivateUser && (
        <Modal
          isOpen={Boolean(deactivateUser)}
          onClose={() => setDeactivateUser(null)}
          title={deactivateUser.is_active ? "Deactivate User Account" : "Activate User Account"}
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to {deactivateUser.is_active ? "deactivate" : "reactivate"} the account for{" "}
              <strong className="text-slate-900">{deactivateUser.full_name}</strong> ({deactivateUser.email})?
            </p>
            {deactivateUser.is_active && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                Deactivated users cannot log into the platform or submit/resolve tickets. Their existing ticket history and comments will be preserved.
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeactivateUser(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isTogglingStatus}
                onClick={handleToggleActiveConfirm}
                className={`px-4 py-2 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors ${
                  deactivateUser.is_active
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {isTogglingStatus
                  ? "Updating..."
                  : deactivateUser.is_active
                  ? "Deactivate Account"
                  : "Activate Account"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;
