import { useState, useEffect, useMemo } from "react";
import { formatCurrency } from "../../utils/helpers";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const ReportsView = () => {
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

        const donationsData = await donationsRes.json();
        const reportsData = await reportsRes.json();

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

  // Get current month donations
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthDonations = useMemo(() => {
    return donations.filter(donation => {
      const donationDate = new Date(donation.createdAt);
      return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
    });
  }, [donations, currentMonth, currentYear]);

  // Calculate summary metrics
  const totalDonationsLifetime = donations.length;
  const totalAmountLifetime = reports?.totalAmount || 0;
  const totalDonationsCurrentMonth = currentMonthDonations.length;
  const totalAmountCurrentMonth = currentMonthDonations
    .filter(d => d.status === "SUCCESS")
    .reduce((sum, d) => sum + d.amount, 0);
  
  // Unique donors count
  const totalDonors = new Set(donations.map(d => d.donor?.name).filter(Boolean)).size;

  // Top donation cause from reports
  const topCause = reports?.byDonationHead?.[0] || null;

  // Cause-wise donation summary from reports
  const causeSummary = reports?.byDonationHead?.map(item => ({
    cause: item._id,
    count: item.count,
    amount: item.sum,
  })) || [];

  // Monthly donation summary (last 12 months)
  const monthlySummary = useMemo(() => {
    const monthStats = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    donations.filter(d => d.status === "SUCCESS").forEach(donation => {
      const date = new Date(donation.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
      const monthLabel = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
      
      if (!monthStats[monthKey]) {
        monthStats[monthKey] = { month: monthLabel, count: 0, amount: 0, dateKey: date };
      }
      monthStats[monthKey].count += 1;
      monthStats[monthKey].amount += donation.amount;
    });

    return Object.values(monthStats)
      .sort((a, b) => b.dateKey - a.dateKey)
      .slice(0, 12)
      .map(({ month, count, amount }) => ({ month, count, amount }));
  }, [donations]);

  // Anonymous vs Named donations
  const anonymousCount = donations.filter(d => d.donor?.anonymousDisplay === true && d.status === "SUCCESS").length;
  const namedCount = donations.filter(d => d.donor?.anonymousDisplay !== true && d.status === "SUCCESS").length;
  const anonymousAmount = donations
    .filter(d => d.donor?.anonymousDisplay === true && d.status === "SUCCESS")
    .reduce((sum, d) => sum + d.amount, 0);
  const namedAmount = donations
    .filter(d => d.donor?.anonymousDisplay !== true && d.status === "SUCCESS")
    .reduce((sum, d) => sum + d.amount, 0);

  // Payment method breakdown
  const onlineStats = reports?.byPaymentMethod?.ONLINE || { amount: 0, count: 0 };
  const cashStats = reports?.byPaymentMethod?.CASH || { amount: 0, count: 0 };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 text-sm mt-1">
          View donation reports and analytics
        </p>
      </div>

      {/* Summary Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Donations</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalDonationsLifetime}</div>
          <div className="text-xs text-gray-600">Lifetime</div>
          <div className="text-lg font-semibold text-amber-900 mt-2">
            {formatCurrency(totalAmountLifetime)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Current Month</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalDonationsCurrentMonth}</div>
          <div className="text-xs text-gray-600">Donations</div>
          <div className="text-lg font-semibold text-amber-900 mt-2">
            {formatCurrency(totalAmountCurrentMonth)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Total Donors</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">{totalDonors}</div>
          <div className="text-xs text-gray-600">Registered</div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">Top Cause</div>
          <div className="text-lg font-bold text-gray-900 mb-1 truncate">
            {topCause ? topCause._id : "N/A"}
          </div>
          <div className="text-sm font-semibold text-amber-900 mt-2">
            {topCause ? formatCurrency(topCause.sum) : formatCurrency(0)}
          </div>
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Breakdown</h2>
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

      {/* Cause-wise Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Cause-wise Donation Summary</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {causeSummary.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                causeSummary.map((item) => (
                  <tr key={item.cause} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.cause}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Donation Summary (Last 12 Months)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Month
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthlySummary.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              ) : (
                monthlySummary.map((item) => (
                  <tr key={item.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {item.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Anonymous vs Named */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Anonymous vs Named Donations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Anonymous Donations</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{anonymousCount}</div>
            <div className="text-sm font-semibold text-amber-900">
              {formatCurrency(anonymousAmount)}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-500 mb-2">Named Donations</div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{namedCount}</div>
            <div className="text-sm font-semibold text-amber-900">
              {formatCurrency(namedAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
