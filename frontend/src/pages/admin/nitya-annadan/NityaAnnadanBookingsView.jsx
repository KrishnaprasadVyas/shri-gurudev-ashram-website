import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Search, Plus, Filter, RefreshCw, ChevronLeft, ChevronRight, Eye, Calendar, ShieldCheck, X } from "lucide-react";

const NityaAnnadanBookingsView = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Selected Booking Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [newSevaDate, setNewSevaDate] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 15);
      if (searchQuery) params.append("search", searchQuery);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (paymentMethodFilter !== "all") params.append("paymentMethod", paymentMethodFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/bookings?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Nitya Annadan bookings");
      }

      const data = await parseJsonResponse(response);
      setBookings(data.bookings || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error("Fetch Nitya Annadan bookings error:", err);
      setError(err.message || "Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, paymentMethodFilter, dateFrom, dateTo]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchBookings();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPaymentMethodFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  // Status override action
  const handleUpdateStatus = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/bookings/${selectedBooking._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errData = await parseJsonResponse(response);
        throw new Error(errData.message || "Failed to update status");
      }

      alert("Status updated successfully");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      alert(err.message || "Could not update status");
    } finally {
      setActionLoading(false);
    }
  };

  // Reschedule date action
  const handleRescheduleDate = async () => {
    if (!selectedBooking || !newSevaDate) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/bookings/${selectedBooking._id}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ newSevaDate }),
        }
      );

      if (!response.ok) {
        const errData = await parseJsonResponse(response);
        throw new Error(errData.message || "Failed to reschedule date");
      }

      alert("Date rescheduled successfully");
      setSelectedBooking(null);
      fetchBookings();
    } catch (err) {
      alert(err.message || "Could not reschedule date");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 overflow-hidden">
      {/* Header & New Booking Trigger */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nitya Annadan Bookings Roster</h1>
          <p className="text-gray-600 text-sm mt-1">
            Master database of all Mahaprasad sponsorship bookings ({pagination.total} total)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/nitya-annadan/add-offline")}
            className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded-md hover:bg-amber-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Offline Seva
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchBookings} className="font-semibold underline">Retry</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="mb-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by devotee name, phone, reference (e.g. ANN-A1B2C3), or Razorpay ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-md hover:bg-gray-800 transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid (Confirmed)</option>
              <option value="payment_pending">Payment Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Payment Method</label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Payment Methods</option>
              <option value="ONLINE">Online (Razorpay)</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Seva Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Seva Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleClearFilters}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold underline"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Bookings Data Table */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <span className="mt-3 inline-block text-sm text-gray-600">Loading bookings...</span>
        </div>
      ) : bookings.length === 0 ? (
        <div className="py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm">No Nitya Annadan bookings found matching filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase font-semibold text-gray-600 border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Seva Date</th>
                <th className="py-3 px-4">Devotee Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-amber-800">
                    {booking.bookingReference}
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">
                    {booking.sevaDate}
                  </td>
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {booking.fullName}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {booking.phoneNumber}
                  </td>
                  <td className="py-3 px-4 font-bold text-gray-900">
                    {formatCurrency(booking.totalAmount)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      {booking.paymentMethod || "ONLINE"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        booking.status === "paid"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "payment_pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status === "paid"
                        ? "Paid"
                        : booking.status === "payment_pending"
                        ? "Pending"
                        : "Cancelled"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setNewSevaDate(booking.sevaDate);
                        setNewStatus(booking.status);
                      }}
                      className="inline-flex items-center px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded text-xs font-semibold transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {!isLoading && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
          <span className="text-gray-500">
            Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total bookings)
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-gray-300 rounded text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700">{page}</span>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 border border-gray-300 rounded text-gray-700 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Booking Detail & Action Overlay Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-gray-100 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {selectedBooking.bookingReference}
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-2">
                Nitya Annadan Seva Detail
              </h2>
            </div>

            {/* Devotee Audit Card */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
              <div>
                <span className="text-gray-500 font-medium">Devotee Full Name:</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedBooking.fullName}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Phone Number:</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{selectedBooking.phoneNumber}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Sponsored Seva Date:</span>
                <p className="font-bold text-amber-900 text-sm mt-0.5">{selectedBooking.sevaDate}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Total Sponsorship:</span>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{formatCurrency(selectedBooking.totalAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Payment Method:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedBooking.paymentMethod}</p>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Created Offline:</span>
                <p className="font-semibold text-gray-800 mt-0.5">{selectedBooking.createdOffline ? "Yes (Admin)" : "No (Online Devotee)"}</p>
              </div>
              {selectedBooking.notes && (
                <div className="col-span-2 bg-amber-50/60 p-2.5 rounded border border-amber-200">
                  <span className="text-gray-500 font-medium">Dedication Notes / Family Names:</span>
                  <p className="font-medium text-gray-800 italic mt-0.5">"{selectedBooking.notes}"</p>
                </div>
              )}
              {selectedBooking.razorpayOrderId && (
                <div className="col-span-2 text-[11px] font-mono text-gray-600">
                  <span>Razorpay Order ID: {selectedBooking.razorpayOrderId}</span>
                  {selectedBooking.razorpayPaymentId && (
                    <span className="block">Razorpay Payment ID: {selectedBooking.razorpayPaymentId}</span>
                  )}
                </div>
              )}
            </div>

            {/* Reschedule Date Controls */}
            <div className="border border-gray-200 p-4 rounded-lg mb-4 bg-amber-50/20">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-1 text-amber-600" />
                Reschedule Sponsored Seva Date
              </h4>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={newSevaDate}
                  onChange={(e) => setNewSevaDate(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                />
                <button
                  onClick={handleRescheduleDate}
                  disabled={actionLoading || newSevaDate === selectedBooking.sevaDate}
                  className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  Reschedule
                </button>
              </div>
            </div>

            {/* Status Override Controls */}
            <div className="border border-gray-200 p-4 rounded-lg bg-gray-50">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1 text-gray-700" />
                Manual Status Override
              </h4>
              <div className="flex items-center gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 flex-1"
                >
                  <option value="paid">Paid (Confirmed)</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading || newStatus === selectedBooking.status}
                  className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  Save Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NityaAnnadanBookingsView;
