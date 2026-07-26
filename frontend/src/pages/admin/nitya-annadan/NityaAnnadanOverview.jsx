import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Calendar, Printer, Plus, Users, CreditCard, RefreshCw } from "lucide-react";

const NityaAnnadanOverview = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/overview`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Nitya Annadan dashboard overview");
      }

      const result = await parseJsonResponse(response);
      setData(result);
    } catch (err) {
      console.error("Error fetching overview:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading Nitya Annadan Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const { stats, todayPatrons = [] } = data || {};

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nitya Annadan Overview</h1>
          <p className="text-gray-600 text-sm mt-1">
            Daily Mahaprasad sponsorship analytics for {formatDate(stats?.todayISO || new Date())}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate("/admin/nitya-annadan/add-offline")}
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded-md hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Offline Seva
          </button>
          <button
            onClick={() => navigate(`/admin/nitya-annadan/print-sheet?date=${stats?.todayISO}`)}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white font-medium text-sm rounded-md hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Today's Aarti Sheet
          </button>
          <button
            onClick={fetchOverview}
            className="p-2 text-gray-600 hover:text-amber-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sponsorships */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Today's Sponsorships</span>
            <Users className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-gray-900">
              {stats?.todayPaidBookings || 0}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              Capacity: {stats?.todayCapacity || 100}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(((stats?.todayPaidBookings || 0) / (stats?.todayCapacity || 100)) * 100)
                )}%`,
              }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-gray-600 flex justify-between">
            <span>{stats?.todayRemainingCapacity} seats left</span>
            <span>{stats?.isTodayBlocked ? "BLOCKED" : "ACTIVE"}</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Monthly Revenue</span>
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-900">
            {formatCurrency(stats?.monthlyRevenue || 0)}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            {stats?.monthlyBookingsCount || 0} confirmed sponsorships this month
          </div>
        </div>

        {/* Lifetime Bookings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sevas</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-gray-900">
            {stats?.totalLifetimeCount || 0}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Confirmed lifetime sponsorships
          </div>
        </div>

        {/* Pending Payments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Checkout</span>
            <RefreshCw className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="text-3xl font-extrabold text-yellow-700">
            {stats?.totalPendingCount || 0}
          </div>
          <div className="mt-3 text-xs text-gray-600">
            Hold spots awaiting online payment completion
          </div>
        </div>
      </div>

      {/* Today's Patron Roster Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Today's Patron Roster</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Devotees sponsoring Mahaprasad Seva for today ({stats?.todayISO})
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/nitya-annadan/calendar")}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700"
          >
            View Full Calendar →
          </button>
        </div>

        {todayPatrons.length === 0 ? (
          <div className="py-8 text-center text-gray-500 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
            No confirmed patrons for today yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Devotee Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Dedication / Notes</th>
                  <th className="py-3 px-4">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {todayPatrons.map((patron, idx) => (
                  <tr key={patron._id || idx} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-700">
                      {patron.bookingReference}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{patron.fullName}</td>
                    <td className="py-3 px-4 text-gray-600">{patron.phoneNumber}</td>
                    <td className="py-3 px-4 text-gray-600 italic">
                      {patron.notes || "—"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {formatCurrency(patron.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default NityaAnnadanOverview;
