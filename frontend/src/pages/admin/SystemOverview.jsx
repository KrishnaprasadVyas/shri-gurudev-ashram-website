import { useState, useEffect } from "react";
import { formatCurrency } from "../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

const SystemOverview = () => {
  const [donations, setDonations] = useState([]);
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication required");
          return;
        }

        // Fetch donations and reports
        const [donationsRes, reportsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/admin/system/donations`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/admin/system/reports`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!donationsRes.ok || !reportsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const donationsData = await parseJsonResponse(donationsRes);
        const reportsData = await parseJsonResponse(reportsRes);

        setDonations(donationsData);
        setReports(reportsData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const totalDonations = donations.length;
  const totalAmount = reports?.totalAmount || 0;
  const successfulDonations = donations.filter(d => d.status === "SUCCESS").length;
  const pendingDonations = donations.filter(d => d.status === "PENDING").length;
  const failedDonations = donations.filter(d => d.status === "FAILED").length;
  
  // Get unique donors count
  const uniqueDonors = new Set(donations.map(d => d.donor?.name).filter(Boolean)).size;
  const anonymousDonations = donations.filter(d => d.donor?.anonymousDisplay === true).length;

  // Payment method stats
  const onlineStats = reports?.byPaymentMethod?.ONLINE || { amount: 0, count: 0 };
  const cashStats = reports?.byPaymentMethod?.CASH || { amount: 0, count: 0 };

  // Top causes from reports
  const topCauses = reports?.byDonationHead || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600 text-sm mt-1">
          Dashboard summary of donations and donors
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Donations</div>
          <div className="text-2xl font-bold text-gray-900">{totalDonations}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Amount</div>
          <div className="text-2xl font-bold text-amber-900">{formatCurrency(totalAmount)}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Unique Donors</div>
          <div className="text-2xl font-bold text-gray-900">{uniqueDonors}</div>
        </div>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-green-600">
            {totalDonations > 0 
              ? Math.round((successfulDonations / totalDonations) * 100) 
              : 0}%
          </div>
        </div>
      </div>

      {/* Payment Status */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm font-medium text-green-700 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-900">{successfulDonations}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="text-sm font-medium text-yellow-700 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-900">{pendingDonations}</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <div className="text-sm font-medium text-red-700 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-900">{failedDonations}</div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-700 mb-1">Online Payments</div>
            <div className="text-2xl font-bold text-blue-900">{onlineStats.count}</div>
            <div className="text-sm text-blue-600 mt-1">{formatCurrency(onlineStats.amount)}</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-sm font-medium text-purple-700 mb-1">Cash Payments</div>
            <div className="text-2xl font-bold text-purple-900">{cashStats.count}</div>
            <div className="text-sm text-purple-600 mt-1">{formatCurrency(cashStats.amount)}</div>
          </div>
        </div>
      </div>

      {/* Top Causes */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Causes</h2>
        <div className="space-y-3">
          {topCauses.length === 0 ? (
            <p className="text-sm text-gray-500">No data available</p>
          ) : (
            topCauses.slice(0, 5).map((cause, index) => (
              <div key={cause._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{cause._id}</span>
                  <span className="text-xs text-gray-500">({cause.count} donations)</span>
                </div>
                <span className="text-sm font-semibold text-amber-900">
                  {formatCurrency(cause.sum)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Anonymous Donations</div>
            <div className="text-xl font-bold text-gray-900">{anonymousDonations}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Average Donation</div>
            <div className="text-xl font-bold text-amber-900">
              {totalDonations > 0 
                ? formatCurrency(Math.round(totalAmount / totalDonations)) 
                : formatCurrency(0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemOverview;
