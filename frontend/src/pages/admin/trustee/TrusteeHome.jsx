import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { financeApi } from "../../../services/financeApi";
import { formatDate } from "../../../utils/helpers";

/**
 * TrusteeHome — Expense Management Overview
 *
 * Shows:
 *   - Expense Summary cards (total expenses, returned amount, outstanding advances, entry count)
 *   - Expense Table (all vouchers — the settled expense records in this ERP system)
 *
 * APIs used (both already consumed elsewhere in the trustee portal):
 *   - financeApi.getDashboardStats() → outstanding advances total
 *   - financeApi.listVouchers()       → all expense entries with amounts
 */
const TrusteeHome = () => {
  const [vouchers, setVouchers] = useState([]);
  const [openAdvancesTotal, setOpenAdvancesTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch in parallel — both APIs are already used in the trustee portal
      const [vouchersRes, statsRes] = await Promise.all([
        financeApi.listVouchers({ limit: 200 }),
        financeApi.getDashboardStats(),
      ]);

      if (vouchersRes.success) {
        setVouchers(vouchersRes.data || []);
      }
      if (statsRes.success) {
        setOpenAdvancesTotal(statsRes.data?.openAdvancesTotal || 0);
      }
    } catch (err) {
      console.error("Failed to load expense overview:", err);
      setError("Unable to load expense data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Derived summary totals from voucher list
  const totalExpenses = vouchers.reduce((s, v) => s + (v.actualAmount || 0), 0);
  const totalReturned = vouchers.reduce((s, v) => s + (v.returnedAmount || 0), 0);

  const CATEGORY_LABELS = {
    GROCERIES_PROVISIONS: "Groceries",
    ELECTRICITY_UTILITIES: "Utilities",
    MAINTENANCE_REPAIRS: "Maintenance",
    STAFF_WAGES: "Staff Wages",
    TRANSPORT: "Transport",
    MEDICAL: "Medical",
    STATIONERY_OFFICE: "Stationery",
    RELIGIOUS_CEREMONIES: "Religious",
    CONSTRUCTION: "Construction",
    TELEPHONE_INTERNET: "Telephone",
    HOSPITALITY: "Hospitality",
    MISCELLANEOUS: "Miscellaneous",
  };

  const SOURCE_LABELS = {
    ADVANCE_SETTLEMENT: "Settled",
    DIRECT_PAYMENT: "Direct",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl shadow-md p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
          <p className="text-amber-100 mt-1 text-sm">
            Shri Gurudev Ashram — Overview of all settled expenses
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-white/20"
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchData} className="text-red-700 font-semibold underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Expense Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Expenses</span>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "---" : fmt(totalExpenses)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Across all settled vouchers</div>
        </div>

        {/* Total Returned Amount */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Returned</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 2 2 2-2 2 2 2-2 4 2z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {loading ? "---" : fmt(totalReturned)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Unspent cash returned from advances</div>
        </div>

        {/* Pending Amount (Outstanding Advances) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Amount</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {loading ? "---" : fmt(openAdvancesTotal)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Open advances not yet settled</div>
        </div>

        {/* Total Expense Entries */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Entries</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {loading ? "---" : vouchers.length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Expense vouchers recorded</div>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Expense Entries</h2>
          <Link
            to="/admin/trustee/advances/new"
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            + Add Expense
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading expenses...</div>
        ) : vouchers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">No expense entries recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Paid To</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Returned</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Remaining</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {vouchers.map((v) => {
                  const remaining =
                    v.advanceAmount != null
                      ? v.advanceAmount - (v.actualAmount || 0) - (v.returnedAmount || 0)
                      : null;
                  return (
                    <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-900 font-medium max-w-[180px] truncate">
                        {v.title || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {CATEGORY_LABELS[v.category] || v.category || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {fmt(v.actualAmount)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">
                        {v.personName || "—"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {v.date ? formatDate(v.date) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          v.sourceType === "DIRECT_PAYMENT"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-emerald-50 text-emerald-700"
                        }`}>
                          {SOURCE_LABELS[v.sourceType] || v.sourceType || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-emerald-700">
                        {v.returnedAmount != null ? fmt(v.returnedAmount) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500">
                        {remaining != null ? fmt(remaining) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          to={`/admin/trustee/vouchers/${v._id}`}
                          className="text-amber-600 hover:text-amber-800 font-medium text-xs underline-offset-2 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrusteeHome;
