import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Plus, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";

const NityaAnnadanAddOffline = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const todayISO = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    sevaDate: todayISO,
    totalAmount: 2100,
    paymentMethod: "CASH",
    notes: "",
  });

  const [capacityInfo, setCapacityInfo] = useState(null);
  const [checkingCapacity, setCheckingCapacity] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  // Check capacity when date changes
  const checkDateCapacity = async (dateStr) => {
    if (!dateStr) return;
    try {
      setCheckingCapacity(true);
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/calendar?month=${dateStr.substring(0, 7)}`, {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await parseJsonResponse(response);
        const dayInfo = data.dailyData?.[dateStr] || { bookedCount: 0 };
        const isBlocked = !!data.blockedDates?.[dateStr];
        const capacity = data.capacity || 100;
        const remaining = Math.max(0, capacity - dayInfo.bookedCount);

        setCapacityInfo({
          date: dateStr,
          booked: dayInfo.bookedCount,
          capacity,
          remaining,
          isBlocked,
          blockedReason: data.blockedDates?.[dateStr],
        });
      }
    } catch (err) {
      console.error("Error checking date capacity:", err);
    } finally {
      setCheckingCapacity(false);
    }
  };

  useEffect(() => {
    checkDateCapacity(formData.sevaDate);
  }, [formData.sevaDate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim() || !formData.phoneNumber.trim() || !formData.sevaDate) {
      setError("Please fill in all required fields (Full Name, Phone Number, Seva Date)");
      return;
    }

    if (capacityInfo?.isBlocked) {
      setError(`Cannot book on ${formData.sevaDate} because it is blocked: ${capacityInfo.blockedReason}`);
      return;
    }

    if (capacityInfo && capacityInfo.remaining <= 0) {
      setError(`Selected date (${formData.sevaDate}) has reached maximum capacity (${capacityInfo.capacity})`);
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/bookings/offline`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errData = await parseJsonResponse(response);
        throw new Error(errData.message || "Failed to create offline Nitya Annadan booking");
      }

      const result = await parseJsonResponse(response);
      setSuccessBooking(result.booking);
    } catch (err) {
      console.error("Offline booking error:", err);
      setError(err.message || "Could not save offline booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Offline Nitya Annadan Seva</h1>
          <p className="text-gray-600 text-sm mt-1">
            Register cash, UPI, or cheque sponsorship collected directly at the Ashram
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/nitya-annadan/bookings")}
          className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Bookings
        </button>
      </div>

      {/* Success Banner */}
      {successBooking ? (
        <div className="p-6 bg-green-50 border border-green-200 rounded-lg space-y-4">
          <div className="flex items-center gap-3 text-green-800">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="text-lg font-bold">Nitya Annadan Seva Booking Confirmed!</h3>
              <p className="text-xs text-green-700">
                Offline sponsorship recorded successfully with instant 'paid' status.
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-green-200 text-sm space-y-1 font-mono">
            <p><span className="text-gray-500">Booking Reference:</span> <strong className="text-amber-800">{successBooking.bookingReference}</strong></p>
            <p><span className="text-gray-500">Devotee Name:</span> {successBooking.fullName}</p>
            <p><span className="text-gray-500">Phone Number:</span> {successBooking.phoneNumber}</p>
            <p><span className="text-gray-500">Seva Date:</span> {successBooking.sevaDate}</p>
            <p><span className="text-gray-500">Amount:</span> ₹{successBooking.totalAmount}</p>
            <p><span className="text-gray-500">Payment Method:</span> {successBooking.paymentMethod}</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setSuccessBooking(null);
                setFormData({
                  fullName: "",
                  phoneNumber: "",
                  sevaDate: todayISO,
                  totalAmount: 2100,
                  paymentMethod: "CASH",
                  notes: "",
                });
              }}
              className="px-4 py-2 bg-amber-600 text-white font-medium text-sm rounded hover:bg-amber-700 transition-colors"
            >
              Add Another Booking
            </button>
            <button
              onClick={() => navigate("/admin/nitya-annadan/bookings")}
              className="px-4 py-2 bg-gray-900 text-white font-medium text-sm rounded hover:bg-gray-800 transition-colors"
            >
              Go to Master Bookings List
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Devotee Full Name & Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Devotee Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                placeholder="e.g. Ramesh Deshmukh"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phoneNumber"
                required
                placeholder="e.g. 9876543210"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>
          </div>

          {/* Seva Date & Live Capacity Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Seva Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="sevaDate"
                required
                value={formData.sevaDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
            </div>

            {/* Capacity Status Box */}
            <div className="flex flex-col justify-end">
              {checkingCapacity ? (
                <span className="text-xs text-gray-500 animate-pulse">Checking capacity...</span>
              ) : capacityInfo ? (
                <div
                  className={`p-2.5 rounded border text-xs ${
                    capacityInfo.isBlocked
                      ? "bg-red-50 border-red-200 text-red-700"
                      : capacityInfo.remaining <= 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-green-50 border-green-200 text-green-800"
                  }`}
                >
                  <span className="font-bold">
                    {capacityInfo.isBlocked
                      ? "BLOCKED DATE"
                      : `${capacityInfo.remaining} Seats Remaining (${capacityInfo.booked}/${capacityInfo.capacity} booked)`}
                  </span>
                  {capacityInfo.isBlocked && <p className="mt-0.5">{capacityInfo.blockedReason}</p>}
                </div>
              ) : null}
            </div>
          </div>

          {/* Sponsorship Amount & Payment Method */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sponsorship Amount (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="totalAmount"
                required
                min="1"
                value={formData.totalAmount}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-bold text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium"
              >
                <option value="CASH">Cash Collection</option>
                <option value="UPI">Direct UPI Transfer</option>
                <option value="CHEQUE">Bank Cheque</option>
              </select>
            </div>
          </div>

          {/* Dedication Notes */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Dedication Notes / Family Names (Optional)
            </label>
            <textarea
              name="notes"
              rows="3"
              placeholder="e.g. In memory of Late Shri Deshmukh / Family prosperity"
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/nitya-annadan/bookings")}
              className="px-5 py-2.5 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || capacityInfo?.isBlocked || capacityInfo?.remaining <= 0}
              className="px-6 py-2.5 bg-amber-600 text-white font-semibold text-sm rounded-md hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {submitting ? "Saving Booking..." : "Confirm & Save Offline Seva"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NityaAnnadanAddOffline;
