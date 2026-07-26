import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  FileText,
  Download,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ExternalLink,
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

const VouchersView = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  // Filters
  const [sourceTypeFilter, setSourceTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (sourceTypeFilter) params.sourceType = sourceTypeFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (searchQuery) params.search = searchQuery;

      const res = await financeApi.listVouchers(params);
      setVouchers(res.data || []);
    } catch (err) {
      console.error("Error fetching vouchers:", err);
      setError(err.message || "Failed to load expense vouchers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [sourceTypeFilter, categoryFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVouchers();
  };

  const handleDownloadPdf = async (v) => {
    setDownloadingId(v._id);
    try {
      await financeApi.downloadVoucherPdf(v._id, v.voucherNumber);
    } catch (err) {
      alert(err.message || "Failed to download voucher PDF.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Expense Vouchers Register
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Permanent financial audit records generated from settled cash advances and direct vendor payments.
          </p>
        </div>
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
              placeholder="Search by Voucher No, Title, or Payee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">All Source Types</option>
              <option value="ADVANCE_SETTLEMENT">Advance Settlement</option>
              <option value="DIRECT_PAYMENT">Direct Vendor Payment</option>
            </select>
          </div>
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
            >
              <option value="">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
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
            Loading expense vouchers...
          </div>
        ) : vouchers.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">No expense vouchers found</p>
            <p className="text-sm text-gray-400 mt-1">
              Vouchers are generated automatically when a cash advance is settled or a direct payment is recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Voucher No</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Payee</th>
                  <th className="py-3.5 px-4">Title & Category</th>
                  <th className="py-3.5 px-4">Source</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {vouchers.map((v) => (
                  <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-gray-900">
                      {v.voucherNumber}
                    </td>
                    <td className="py-4 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(v.date || v.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-4 font-medium text-gray-800">
                      {v.personName}
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <p className="font-medium text-gray-900 truncate">
                        {v.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {CATEGORY_LABELS[v.category] || v.category}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          v.sourceType === "DIRECT_PAYMENT"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {v.sourceType === "DIRECT_PAYMENT"
                          ? "Direct Payment"
                          : "Settlement"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-black text-emerald-700">
                      ₹{Number(v.actualAmount || 0).toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        to={`/admin/trustee/vouchers/${v._id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf(v)}
                        disabled={downloadingId === v._id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded shadow-sm transition-colors disabled:opacity-50"
                      >
                        {downloadingId === v._id ? (
                          <div className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <Download className="w-3.5 h-3.5" />
                        )}
                        PDF
                      </button>
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

export default VouchersView;
