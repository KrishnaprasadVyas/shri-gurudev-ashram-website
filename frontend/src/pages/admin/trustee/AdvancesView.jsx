import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
} from "lucide-react";
import { financeApi } from "../../../services/financeApi";

const CATEGORY_LABELS = {
  GROCERIES_PROVISIONS: "Groceries & Provisions",
  ELECTRICITY_UTILITIES: "Electricity & Utilities",
  MAINTENANCE_REPAIRS: "Maintenance & Repairs",
  STAFF_WAGES: "Staff Wages",
  TRANSPORT: "Transport & Travel",
  MEDICAL: "Medical Expenses",
  STATIONERY_OFFICE: "Stationery & Office",
  RELIGIOUS_CEREMONIES: "Religious & Pooja",
  CONSTRUCTION: "Construction & Infra",
  TELEPHONE_INTERNET: "Telephone & Internet",
  HOSPITALITY: "Hospitality & Prasad",
  MISCELLANEOUS: "Miscellaneous",
};

const AdvancesView = () => {
  const navigate = useNavigate();
  const [advances, setAdvances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const fetchAdvances = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await financeApi.listAdvances(params);
      setAdvances(res.data || []);
    } catch (err) {
      console.error("Error fetching advances:", err);
      setError(err.message || "Failed to load cash advances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvances();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAdvances();
  };

  const handleOpenCancel = (advance) => {
    setSelectedAdvance(advance);
    setCancelReason("");
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedAdvance) return;
    setCancelling(true);
    try {
      await financeApi.cancelAdvance(selectedAdvance._id, cancelReason);
      setCancelModalOpen(false);
      setSelectedAdvance(null);
      fetchAdvances();
    } catch (err) {
      alert(err.message || "Failed to cancel advance.");
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "OPEN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> Open
          </span>
        );
      case "SETTLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Settled
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cash Advances & Direct Payments
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage Type A cash advances (awaiting return/settlement) and Type B direct vendor payments.
          </p>
        </div>
        <Link
          to="/admin/trustee/advances/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> New Advance / Payment
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Advance No, Payee Name, or Purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open (Unsettled)</option>
              <option value="SETTLED">Settled</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">All Types</option>
              <option value="ADVANCE">Type A — Cash Advance</option>
              <option value="DIRECT_PAYMENT">Type B — Direct Payment</option>
            </select>
          </div>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            Loading cash advances...
          </div>
        ) : advances.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No cash advances found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your search or filters, or create a new advance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Ref No</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Payee</th>
                  <th className="py-3.5 px-4">Purpose & Category</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Voucher</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {advances.map((adv) => (
                  <tr key={adv._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-gray-900">
                      {adv.advanceNumber}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          adv.type === "ADVANCE"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {adv.type === "ADVANCE" ? "Advance" : "Direct Pay"}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-800">
                      {adv.givenTo?.name || "N/A"}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {adv.purpose}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CATEGORY_LABELS[adv.category] || adv.category}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right font-bold text-gray-900">
                      ₹{Number(adv.advanceAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(adv.status)}</td>
                    <td className="py-4 px-4">
                      {adv.voucherNumber ? (
                        <Link
                          to={`/admin/trustee/vouchers/${adv.voucherId}`}
                          className="font-mono text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          {adv.voucherNumber}
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      {adv.status === "OPEN" && adv.type === "ADVANCE" && (
                        <>
                          <Link
                            to={`/admin/trustee/advances/${adv._id}/settle`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                          >
                            Settle
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleOpenCancel(adv)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-medium rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {adv.status === "SETTLED" && adv.voucherId && (
                        <Link
                          to={`/admin/trustee/vouchers/${adv.voucherId}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                        >
                          Voucher
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Cancel Cash Advance ({selectedAdvance?.advanceNumber})
            </h3>
            <p className="text-sm text-gray-600">
              Are you sure you want to cancel this open advance for{" "}
              <strong>{selectedAdvance?.givenTo?.name}</strong>? This action will mark
              the advance as cancelled.
            </p>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Cancellation (Optional)
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Purchase cancelled by payee..."
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-rose-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
                disabled={cancelling}
              >
                Keep Open
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancesView;
