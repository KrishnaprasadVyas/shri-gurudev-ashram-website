import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  Download,
  DollarSign,
  Calendar,
  User,
  Heart,
  FileText,
  AlertCircle,
} from "lucide-react";
import { financeApi } from "../../../services/financeApi";

const DonationsView = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.paymentMethod = methodFilter;

      const res = await financeApi.listDonations(params);
      setDonations(res || []);
    } catch (err) {
      console.error("Error fetching donations:", err);
      setError(err.message || "Failed to load donations.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter]);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  // Client-side search filter
  const filteredDonations = useMemo(() => {
    if (!searchQuery.trim()) return donations;
    const q = searchQuery.toLowerCase().trim();
    return donations.filter((d) => {
      const donorName = d.donor?.anonymousDisplay
        ? "Anonymous"
        : d.donor?.name || d.user?.fullName || "";
      const receipt = d.receiptNumber || "";
      const cause = d.donationHead?.name || d.cause || "";
      return (
        donorName.toLowerCase().includes(q) ||
        receipt.toLowerCase().includes(q) ||
        cause.toLowerCase().includes(q)
      );
    });
  }, [donations, searchQuery]);

  const handleDownloadReceipt = async (donation) => {
    if (!donation._id || donation.status !== "SUCCESS") return;
    setDownloadingId(donation._id);
    try {
      await financeApi.downloadDonationReceipt(
        donation._id,
        donation.receiptNumber || donation._id
      );
    } catch (err) {
      console.error("Receipt download error:", err);
      alert("Failed to download receipt PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  // Compute stats
  const totalAmount = useMemo(() => {
    return filteredDonations
      .filter((d) => d.status === "SUCCESS")
      .reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [filteredDonations]);

  const cashCount = useMemo(() => {
    return filteredDonations.filter((d) => d.paymentMethod === "CASH" && d.status === "SUCCESS").length;
  }, [filteredDonations]);

  const onlineCount = useMemo(() => {
    return filteredDonations.filter((d) => d.paymentMethod !== "CASH" && d.status === "SUCCESS").length;
  }, [filteredDonations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Ashram Donations Register
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage online and offline seva contributions with prefixed receipts.
          </p>
        </div>
        <Link
          to="/admin/trustee/donations/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium text-sm rounded-lg shadow-sm transition-all duration-200"
        >
          <Plus className="w-4 h-4 mr-2" />
          Enter Offline Seva
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-xl border border-amber-100/80">
          <div className="flex items-center justify-between text-amber-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Seva Amount</span>
            <DollarSign className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            ₹{totalAmount.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-amber-700/80 mt-1">From {filteredDonations.filter(d => d.status === "SUCCESS").length} successful donations</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100/80">
          <div className="flex items-center justify-between text-blue-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Cash Seva (CA-)</span>
            <Heart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{cashCount}</div>
          <div className="text-xs text-blue-700/80 mt-1">Offline cash counter deposits</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-xl border border-emerald-100/80">
          <div className="flex items-center justify-between text-emerald-800 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Digital / Cheque</span>
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{onlineCount}</div>
          <div className="text-xs text-emerald-700/80 mt-1">UPI, Cheque & Online gateways</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search donor, receipt no, cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Methods</option>
            <option value="CASH">Cash (CA-)</option>
            <option value="UPI">UPI (UPI-)</option>
            <option value="CHEQUE">Cheque (CH-)</option>
            <option value="RAZORPAY">Online (OL-)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm">Loading donations records...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-600 flex flex-col items-center justify-center">
            <AlertCircle className="w-10 h-10 mb-2 text-red-500" />
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={fetchDonations}
              className="mt-3 px-4 py-1.5 bg-red-50 text-red-700 text-xs font-medium rounded-md hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-base font-medium text-gray-700">No donations found</p>
            <p className="text-xs text-gray-400 mt-1">Try adjusting search criteria or enter a new seva record.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Receipt No.</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Donor Name</th>
                  <th className="py-3.5 px-4">Cause / Seva Head</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredDonations.map((donation) => {
                  const donorName = donation.donor?.anonymousDisplay
                    ? "Anonymous (Gupt Seva)"
                    : donation.donor?.name || donation.user?.fullName || "Devotee";
                  const causeName = donation.donationHead?.name || donation.cause || "General Seva";
                  const receiptNo = donation.receiptNumber || "Pending";

                  return (
                    <tr key={donation._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-xs text-gray-800">
                        {receiptNo}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-gray-600 whitespace-nowrap">
                        {new Date(donation.createdAt || donation.paymentDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900 max-w-[180px] truncate">
                        {donorName}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 max-w-[160px] truncate">
                        {causeName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            donation.paymentMethod === "CASH"
                              ? "bg-blue-100 text-blue-800"
                              : donation.paymentMethod === "UPI"
                              ? "bg-green-100 text-green-800"
                              : donation.paymentMethod === "CHEQUE"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {donation.paymentMethod || "ONLINE"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                        ₹{(Number(donation.amount) || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            donation.status === "SUCCESS"
                              ? "bg-emerald-100 text-emerald-800"
                              : donation.status === "PENDING"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {donation.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {donation.status === "SUCCESS" ? (
                          <button
                            onClick={() => handleDownloadReceipt(donation)}
                            disabled={downloadingId === donation._id}
                            className="inline-flex items-center text-xs font-medium text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" />
                            {downloadingId === donation._id ? "..." : "PDF"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
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

export default DonationsView;
