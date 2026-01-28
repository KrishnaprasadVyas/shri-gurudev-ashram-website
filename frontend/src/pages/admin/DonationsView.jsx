import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { Plus, Download, RefreshCw } from "lucide-react";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

const DonationsView = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [causeFilter, setCauseFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch donations from API
  // Fetch donations from API
  const fetchDonations = async () => {
    setIsLoading(true);
    setError("");
    
    try {
      const params = new URLSearchParams();
      if (paymentMethodFilter !== "all") params.append("paymentMethod", paymentMethodFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (dateFrom) params.append("startDate", dateFrom);
      if (dateTo) params.append("endDate", dateTo);

      const response = await fetch(
        `${API_BASE_URL}/admin/system/donations?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch donations");
      }

      const data = await parseJsonResponse(response);
      setDonations(data);
    } catch (err) {
      setError(err.message || "Failed to load donations");
      console.error("Fetch donations error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDonations();
    }
  }, [token, paymentMethodFilter, statusFilter, dateFrom, dateTo]);

  // Get unique causes from donations
  const causes = useMemo(() => {
    const uniqueCauses = new Set(donations.map(d => d.donationHead?.name).filter(Boolean));
    return Array.from(uniqueCauses).sort();
  }, [donations]);

  // Filter donations (client-side for cause and search)
  const filteredDonations = useMemo(() => {
    return donations.filter(donation => {
      // Cause filter
      if (causeFilter !== "all" && donation.donationHead?.name !== causeFilter) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const donorName = donation.donor?.anonymousDisplay 
          ? "Anonymous" 
          : donation.donor?.name || "";
        return donorName.toLowerCase().includes(query);
      }

      return true;
    });
  }, [donations, causeFilter, searchQuery]);

  const handleDownloadReceipt = (donation) => {
    if (donation.receiptUrl) {
      // Use relative path for receipts served from same origin
      window.open(donation.receiptUrl, "_blank");
    }
  };

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setCauseFilter("all");
    setPaymentMethodFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters = dateFrom || dateTo || causeFilter !== "all" || 
    paymentMethodFilter !== "all" || statusFilter !== "all" || searchQuery;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Donations</h1>
          <p className="text-gray-600 text-sm mt-1">
            View and manage all donation records
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/system/cash-donation")}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Cash Donation
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchDonations}
            className="text-red-700 hover:text-red-800 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Methods</option>
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {/* Cause Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Cause
            </label>
            <select
              value={causeFilter}
              onChange={(e) => setCauseFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Causes</option>
              {causes.map(cause => (
                <option key={cause} value={cause}>{cause}</option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Search Donor
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Clear Filters & Refresh */}
        <div className="flex items-center gap-4">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Clear Filters
            </button>
          )}
          <button
            onClick={fetchDonations}
            disabled={isLoading}
            className="text-sm text-gray-600 hover:text-gray-700 font-medium inline-flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading donations...</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Donor Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cause
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Receipt
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No donations found
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => (
                  <tr key={donation._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(donation.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.donor?.anonymousDisplay 
                        ? "Anonymous" 
                        : donation.donor?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {donation.donationHead?.name || donation.cause || "General Seva"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          donation.paymentMethod === "CASH"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {donation.paymentMethod || "ONLINE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          donation.status === "SUCCESS"
                            ? "bg-green-100 text-green-800"
                            : donation.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {donation.receiptUrl && donation.status === "SUCCESS" ? (
                        <button
                          onClick={() => handleDownloadReceipt(donation)}
                          className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredDonations.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Total Records: {filteredDonations.length}
            </span>
            <div className="flex flex-wrap gap-4">
              <span className="text-sm text-gray-700">
                Online: {formatCurrency(
                  filteredDonations
                    .filter(d => d.paymentMethod !== "CASH" && d.status === "SUCCESS")
                    .reduce((sum, d) => sum + d.amount, 0)
                )}
              </span>
              <span className="text-sm text-gray-700">
                Cash: {formatCurrency(
                  filteredDonations
                    .filter(d => d.paymentMethod === "CASH" && d.status === "SUCCESS")
                    .reduce((sum, d) => sum + d.amount, 0)
                )}
              </span>
              <span className="text-sm font-semibold text-amber-900">
                Total: {formatCurrency(
                  filteredDonations
                    .filter(d => d.status === "SUCCESS")
                    .reduce((sum, d) => sum + d.amount, 0)
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsView;
