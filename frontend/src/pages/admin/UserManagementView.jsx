import React, { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";
import { useAuth } from "../../context/AuthContext";

const ROLE_COLORS = {
  SYSTEM_ADMIN: "bg-red-100 text-red-800 border-red-200",
  TRUSTEE: "bg-purple-100 text-purple-800 border-purple-200",
  COLLECTOR_PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  COLLECTOR_APPROVED: "bg-cyan-100 text-cyan-800 border-cyan-200",
  WEBSITE_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  NITYA_ANNADAN_ADMIN: "bg-emerald-100 text-emerald-800 border-emerald-200",
  USER: "bg-gray-100 text-gray-800 border-gray-200",
};

const ALL_ROLES = [
  "SYSTEM_ADMIN",
  "TRUSTEE",
  "COLLECTOR_PENDING",
  "COLLECTOR_APPROVED",
  "WEBSITE_ADMIN",
  "NITYA_ANNADAN_ADMIN",
  "USER",
];

// Roles that can be assigned via UI
const ASSIGNABLE_ROLES = ALL_ROLES.filter((r) => r !== "SYSTEM_ADMIN");

export default function UserManagementView() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [filters, setFilters] = useState({
    search: "",
    role: "ALL",
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.system.getUsers({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });
      const data = res.data || res;
      setUsers(data.users || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setUpdatingId(userId);
    try {
      await adminApi.system.changeUserRole(userId, newRole);
      showToast("Role updated successfully");
      fetchUsers();
    } catch (err) {
      console.error("Role update failed:", err);
      showToast(err.message || "Failed to update role", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 translate-y-0 opacity-100 z-50 ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          }`}
        >
          <div className="flex items-center space-x-2">
            {toast.type === "error" ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
          <p className="text-gray-500 text-sm mt-1">Assign roles to control access to various modules of the ERP.</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Important Note on Role Changes</h3>
            <p className="mt-1 text-sm text-blue-700">
              When you change a user's role, the change is recorded in the statutory Audit Log. The user <strong>must log out and log back in</strong> for the new role permissions to take effect.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Search Users</label>
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleFilterChange}
            placeholder="Search by name or mobile..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
          />
        </div>
        <div className="w-full sm:w-64">
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Filter by Role</label>
          <select
            name="role"
            value={filters.role}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 text-sm"
          >
            <option value="ALL">All Roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium">
                    No users found matching the criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u._id === user.userId || u.mobile === user.mobile; // Basic check
                  const isSystemAdmin = u.role === "SYSTEM_ADMIN";
                  const canEdit = !isSelf && !isSystemAdmin;

                  return (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold uppercase">
                            {u.name ? u.name.charAt(0) : "U"}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500 font-mono">ID: {u._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {u.mobile}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${ROLE_COLORS[u.role] || ROLE_COLORS.USER}`}>
                          {u.role}
                        </span>
                        {isSelf && <span className="ml-2 text-xs text-amber-600 font-medium">(You)</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {updatingId === u._id ? (
                          <span className="text-amber-600 text-xs flex justify-end items-center">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-600 mr-2"></div>
                            Updating...
                          </span>
                        ) : !canEdit ? (
                          <span className="text-gray-400 text-xs italic">Not Editable</span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            className="text-xs border-gray-300 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 py-1 pl-2 pr-6 bg-gray-50 hover:bg-white cursor-pointer"
                          >
                            {ASSIGNABLE_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + (users.length > 0 ? 1 : 0)}</span> to <span className="font-medium">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
