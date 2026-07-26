import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { financeApi } from "../../../services/financeApi";

/**
 * TrusteeHome — ERP Phase 5
 *
 * Real financial dashboard for Shri Gurudev Ashram Trustee Portal.
 * Displays real-time summary figures:
 *   - Outstanding Cash Advances (Count & Amount)
 *   - Today's Donations (Count & Amount)
 *   - This Month's Expense Vouchers (Count & Amount)
 *   - Net Monthly Flow (Donations - Vouchers)
 *
 * Includes quick action buttons for common trustee daily workflows.
 */
const TrusteeHome = () => {
  const [stats, setStats] = useState({
    openAdvancesCount: 0,
    openAdvancesTotal: 0,
    todayDonationsCount: 0,
    todayDonationsTotal: 0,
    monthVouchersCount: 0,
    monthVouchersTotal: 0,
    netMonthBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError("Unable to load live dashboard statistics. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-xl shadow-md p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Ashram ERP Dashboard</h1>
          <p className="text-amber-100 mt-1 text-sm">
            Shri Gurudev Ashram — Financial Management Portal
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardStats}
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
          <span className="px-3 py-1 bg-emerald-500/90 text-white text-xs font-bold rounded-full uppercase tracking-wide shadow-sm">
            Phase 5 Active
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDashboardStats}
            className="text-red-700 font-semibold underline text-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Donations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today&apos;s Inflow</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "---" : formatCurrency(stats.todayDonationsTotal)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? "..." : `${stats.todayDonationsCount} donation receipts issued today`}
            </div>
          </div>
        </div>

        {/* Card 2: Outstanding Advances */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Advances</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">
              {loading ? "---" : formatCurrency(stats.openAdvancesTotal)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? "..." : `${stats.openAdvancesCount} advances pending settlement`}
            </div>
          </div>
        </div>

        {/* Card 3: This Month Vouchers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Expenses</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? "---" : formatCurrency(stats.monthVouchersTotal)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? "..." : `${stats.monthVouchersCount} vouchers approved this month`}
            </div>
          </div>
        </div>

        {/* Card 4: Net Monthly Flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Net Monthly Flow</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </span>
          </div>
          <div>
            <div className={`text-2xl font-bold ${stats.netMonthBalance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {loading ? "---" : formatCurrency(stats.netMonthBalance)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {loading ? "..." : "Donations minus expense vouchers this month"}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/admin/trustee/donations/new"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-amber-500 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Record Counter Seva</h3>
              <p className="text-xs text-gray-500 mt-0.5">Issue offline donation receipt for Cash, Cheque, or UPI</p>
            </div>
          </Link>

          <Link
            to="/admin/trustee/advances"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-amber-500 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Cash Advances</h3>
              <p className="text-xs text-gray-500 mt-0.5">Disburse advances, settle bills, or make vendor payments</p>
            </div>
          </Link>

          <Link
            to="/admin/trustee/reports"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-amber-500 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Financial Reports</h3>
              <p className="text-xs text-gray-500 mt-0.5">View Cash Book, Voucher Register, and export CA audit logs</p>
            </div>
          </Link>

          <Link
            to="/admin/trustee/audit-logs"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-amber-500 hover:shadow-md transition-all flex items-center gap-4 group"
          >
            <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">Audit Trail</h3>
              <p className="text-xs text-gray-500 mt-0.5">Inspect permanent, read-only statutory accounting logs</p>
            </div>
          </Link>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Ashram ERP Module Status
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 1: Foundation (Active)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 2: Receipt Counters (Active)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 3: Advances &amp; Vouchers (Active)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 4: Offline Donations (Active)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 5: Reports &amp; Dashboard (Active)</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm font-medium text-emerald-900">Phase 6: Audit Log Viewer (Active)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrusteeHome;
