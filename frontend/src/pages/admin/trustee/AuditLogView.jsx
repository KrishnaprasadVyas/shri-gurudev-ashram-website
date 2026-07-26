import React, { useState, useEffect, useCallback } from "react";
import { financeApi } from "../../../services/financeApi";

const ACTION_COLOR_MAP = {
  CREATED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800",
  SETTLED: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800",
  VOUCHER: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800",
  DONATION: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800",
  ROLE: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800",
  DEFAULT: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
};

function getBadgeColor(action = "") {
  const upper = action.toUpperCase();
  if (upper.includes("SETTLE")) return ACTION_COLOR_MAP.SETTLED;
  if (upper.includes("VOUCHER")) return ACTION_COLOR_MAP.VOUCHER;
  if (upper.includes("DONAT")) return ACTION_COLOR_MAP.DONATION;
  if (upper.includes("ROLE")) return ACTION_COLOR_MAP.ROLE;
  if (upper.includes("CREATE")) return ACTION_COLOR_MAP.CREATED;
  return ACTION_COLOR_MAP.DEFAULT;
}

export default function AuditLogView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    entity: "ALL",
    action: "ALL",
    startDate: "",
    endDate: "",
    search: "",
  });

  // Dynamic filter dropdown options from API
  const [filterOptions, setFilterOptions] = useState({
    actions: ["ADVANCE_CREATED", "ADVANCE_SETTLED", "DIRECT_PAYMENT_CREATED", "VOUCHER_CREATED", "DONATION_CREATED", "ROLE_CHANGED"],
    entities: ["CashAdvance", "Voucher", "Donation", "User"],
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 1,
  });

  // Modal state for viewing deep structured details
  const [selectedLog, setSelectedLog] = useState(null);

  // Load filter options once on mount
  useEffect(() => {
    financeApi
      .getAuditLogFilters()
      .then((res) => {
        if (res?.data || res?.actions) {
          const data = res.data || res;
          setFilterOptions({
            actions: data.actions || filterOptions.actions,
            entities: data.entities || filterOptions.entities,
          });
        }
      })
      .catch((err) => console.error("Could not load audit filter dropdowns:", err));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await financeApi.getAuditLogs({
        ...filters,
        page: pagination.page,
        limit: pagination.limit,
      });

      const responseData = res?.data || res;
      setLogs(responseData.logs || []);
      if (responseData.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: responseData.pagination.total || 0,
          pages: responseData.pagination.pages || 1,
        }));
      }
    } catch (err) {
      console.error("Failed to fetch statutory audit logs:", err);
      setError("Unable to load statutory audit trail. Please verify your administrator permissions.");
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      entity: "ALL",
      action: "ALL",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "—";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number(amount));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-indigo-800/40">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold uppercase tracking-wider mb-1">
            <span>Statutory Compliance</span>
            <span>•</span>
            <span>ERP Phase 6</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Statutory Financial Audit Trail</h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Permanent, append-only chronological ledger of all accounting operations, cash advance disbursements, settlements, and statutory vouchers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-xl font-medium text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Ledger
          </button>
        </div>
      </div>

      {/* Read-Only Statutory Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
        <span className="text-amber-600 dark:text-amber-400 text-xl mt-0.5">🔒</span>
        <div className="text-sm text-amber-900 dark:text-amber-200">
          <span className="font-bold">Append-Only Statutory Ledger: </span>
          In compliance with CA audit standards and Ashram financial governance, audit records are cryptographically protected by database immutability rules. Records cannot be edited, deleted, or purged via application interfaces.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Search Term */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Search Ledger
            </label>
            <div className="relative">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Ref No, Performer, Notes..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Entity Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Statutory Entity
            </label>
            <select
              name="entity"
              value={filters.entity}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            >
              <option value="ALL">All Entities</option>
              {filterOptions.entities.map((ent) => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Operation Action
            </label>
            <select
              name="action"
              value={filters.action}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            >
              <option value="ALL">All Actions</option>
              {filterOptions.actions.map((act) => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                From Date
              </label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                To Date
              </label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleResetFilters}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reset All Filters
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-2xl text-sm">
          {error}
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold tracking-wider">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Performed By</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Operation Action</th>
                <th className="py-3.5 px-4">Entity & Ref</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-center">Metadata / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-medium text-sm">Retrieving statutory ledger entries...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-medium">No audit log records found matching your current filter criteria.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const amt = log.financialDetails?.amount !== undefined && log.financialDetails?.amount !== null
                    ? log.financialDetails.amount
                    : (log.details?.advanceAmount || log.details?.actualExpense || log.details?.amount || null);

                  const hasDeepData = log.details || (log.changes && (log.changes.before || log.changes.after)) || log.notes || log.financialDetails;

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-400">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        {log.performedByName || "Statutory User"}
                        <div className="text-[10px] text-slate-400 font-mono">ID: {log.performedBy ? String(log.performedBy).slice(-6) : "SYSTEM"}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {log.performedByRole || "ADMIN"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {log.entityRef || "—"}
                        </div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                          {log.entity}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(amt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-center">
                        {hasDeepData ? (
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-800/60 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-semibold transition inline-flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Inspect Trail
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No metadata</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/50 px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1}
            </span>
            <span>to</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>
            <span>of</span>
            <span className="font-bold text-slate-900 dark:text-white">{pagination.total}</span>
            <span>statutory records</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pagination.limit}
                onChange={(e) => setPagination((prev) => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-white font-medium focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1 || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition font-medium"
              >
                Previous
              </button>
              <span className="px-3 py-1 font-semibold text-slate-900 dark:text-white">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-indigo-400">Statutory Record Inspection</span>
                <h3 className="text-xl font-bold flex items-center gap-2 mt-1">
                  <span>{selectedLog.action}</span>
                  <span className="text-sm font-mono font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedLog.entity} — {selectedLog.entityRef || "NO REF"}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm divide-y divide-slate-100 dark:divide-slate-800">
              {/* Core Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Timestamp</span>
                  <span className="font-mono text-slate-900 dark:text-white text-xs">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Performed By</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedLog.performedByName || "Statutory User"}</span>
                  <span className="block text-[11px] text-indigo-600 dark:text-indigo-400 font-mono">Role: {selectedLog.performedByRole || "ADMIN"}</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Network Trace</span>
                  <span className="font-mono text-slate-900 dark:text-white text-xs block">IP: {selectedLog.ipAddress || "Server/Internal"}</span>
                  <span className="text-[10px] text-slate-400 truncate block mt-0.5" title={selectedLog.userAgent}>{selectedLog.userAgent || "No Agent"}</span>
                </div>
              </div>

              {/* Financial Snapshot if present */}
              {selectedLog.financialDetails && Object.values(selectedLog.financialDetails).some(Boolean) && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Financial Snapshot
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                    <div>
                      <span className="block text-xs text-slate-500">Amount</span>
                      <span className="font-mono font-bold text-indigo-900 dark:text-indigo-300">
                        {formatCurrency(selectedLog.financialDetails.amount)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Mode</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedLog.financialDetails.paymentMode || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Ref / UTR</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {selectedLog.financialDetails.referenceNumber || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-slate-500">Status Change</span>
                      <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                        {selectedLog.financialDetails.previousStatus || "—"} → {selectedLog.financialDetails.newStatus || "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLog.notes && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Operation Notes
                  </h4>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 italic border border-slate-200 dark:border-slate-700">
                    "{selectedLog.notes}"
                  </div>
                </div>
              )}

              {/* Structured Metadata / Details */}
              {selectedLog.details && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Action Metadata Details (JSON)
                  </h4>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto border border-slate-800">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Changes Before / After */}
              {selectedLog.changes && (selectedLog.changes.before || selectedLog.changes.after) && (
                <div className="pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    State Mutation Comparison (Before vs After)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                      <span className="block font-sans font-bold text-rose-800 dark:text-rose-400 mb-2 uppercase text-[10px]">Previous State (Before)</span>
                      <pre className="overflow-x-auto text-rose-900 dark:text-rose-200">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
                      <span className="block font-sans font-bold text-emerald-800 dark:text-emerald-400 mb-2 uppercase text-[10px]">New State (After)</span>
                      <pre className="overflow-x-auto text-emerald-900 dark:text-emerald-200">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-medium text-sm transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
