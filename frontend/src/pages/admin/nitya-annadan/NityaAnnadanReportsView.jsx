import { useState, useEffect } from "react";
import { formatCurrency } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Download, FileText, BarChart2, PieChart, CreditCard } from "lucide-react";

const NityaAnnadanReportsView = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/reports`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch Nitya Annadan reports");
      }

      const data = await parseJsonResponse(response);
      setReports(data);
    } catch (err) {
      console.error("Fetch reports error:", err);
      setError(err.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/export`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to export CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nitya_annadan_bookings_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || "CSV export failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Loading Seva Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-red-600">
        {error}
      </div>
    );
  }

  const { statusBreakdown = [], methodBreakdown = [], monthlyTrends = [] } = reports || {};

  return (
    <div className="space-y-6">
      {/* Top Header & Export Trigger */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nitya Annadan Reports & Analytics</h1>
          <p className="text-gray-600 text-sm mt-1">
            Financial breakdown, sponsorship status metrics, and payment audit logs
          </p>
        </div>
        <button
          onClick={handleDownloadCSV}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-md hover:bg-amber-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export All Bookings (CSV)
        </button>
      </div>

      {/* Grid: Status & Payment Method Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2 text-amber-600" />
            Booking Status Breakdown
          </h2>
          <div className="space-y-3">
            {statusBreakdown.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-3 h-3 rounded-full ${
                      item._id === "paid"
                        ? "bg-green-500"
                        : item._id === "payment_pending"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  <span className="font-semibold text-gray-800 text-sm capitalize">
                    {item._id === "paid"
                      ? "Confirmed Paid"
                      : item._id === "payment_pending"
                      ? "Pending Checkout"
                      : "Cancelled"}
                  </span>
                </div>
                <div className="text-right text-sm">
                  <span className="font-bold text-gray-900 block">{item.count} bookings</span>
                  <span className="text-xs text-gray-500">{formatCurrency(item.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            Payment Channel Breakdown
          </h2>
          <div className="space-y-3">
            {methodBreakdown.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
              >
                <span className="font-semibold text-gray-800 text-sm">
                  {item._id || "ONLINE"}
                </span>
                <div className="text-right text-sm">
                  <span className="font-bold text-gray-900 block">{item.count} bookings</span>
                  <span className="text-xs text-amber-800 font-semibold">{formatCurrency(item.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BarChart2 className="w-5 h-5 mr-2 text-green-600" />
          Monthly Revenue & Sponsorship Trends (Last 12 Months)
        </h2>
        {monthlyTrends.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No monthly records available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-600 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Confirmed Bookings</th>
                  <th className="py-3 px-4">Total Funds Raised</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyTrends.map((trend) => (
                  <tr key={trend._id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-gray-900">{trend._id}</td>
                    <td className="py-3 px-4 font-medium text-gray-700">{trend.count} sponsorships</td>
                    <td className="py-3 px-4 font-bold text-amber-900">{formatCurrency(trend.totalAmount)}</td>
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

export default NityaAnnadanReportsView;
