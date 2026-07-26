import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  User,
  Tag,
  CreditCard,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { financeApi } from "../../../services/financeApi";

const CATEGORIES = [
  { id: "GROCERIES_PROVISIONS", label: "Groceries & Provisions" },
  { id: "ELECTRICITY_UTILITIES", label: "Electricity & Utilities" },
  { id: "MAINTENANCE_REPAIRS", label: "Maintenance & Repairs" },
  { id: "STAFF_WAGES", label: "Staff Wages" },
  { id: "TRANSPORT", label: "Transport & Travel" },
  { id: "MEDICAL", label: "Medical Expenses" },
  { id: "STATIONERY_OFFICE", label: "Stationery & Office" },
  { id: "RELIGIOUS_CEREMONIES", label: "Religious & Pooja" },
  { id: "CONSTRUCTION", label: "Construction & Infra" },
  { id: "TELEPHONE_INTERNET", label: "Telephone & Internet" },
  { id: "HOSPITALITY", label: "Hospitality & Prasad" },
  { id: "MISCELLANEOUS", label: "Miscellaneous" },
];

const PAYMENT_MODES = ["CASH", "CHEQUE", "UPI", "RTGS", "NEFT"];

const AdvanceForm = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ADVANCE"); // "ADVANCE" or "DIRECT_PAYMENT"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [givenToName, setGivenToName] = useState("");
  const [purpose, setPurpose] = useState("");
  const [category, setCategory] = useState("GROCERIES_PROVISIONS");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  // Direct Payment specific
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [bankName, setBankName] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!givenToName.trim() || !purpose.trim() || !amount) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      if (activeTab === "ADVANCE") {
        await financeApi.createAdvance({
          givenToName: givenToName.trim(),
          purpose: purpose.trim(),
          category,
          advanceAmount: Number(amount),
          notes: notes.trim(),
        });
        navigate("/admin/trustee/advances");
      } else {
        const res = await financeApi.createDirectPayment({
          givenToName: givenToName.trim(),
          purpose: purpose.trim(),
          category,
          actualAmount: Number(amount),
          paymentMode,
          paymentRef: paymentRef.trim(),
          bankName: bankName.trim(),
          paymentDate: paymentDate || new Date(),
          notes: notes.trim(),
        });
        const voucherId = res.data?.voucher?._id;
        if (voucherId) {
          navigate(`/admin/trustee/vouchers/${voucherId}`);
        } else {
          navigate("/admin/trustee/advances");
        }
      }
    } catch (err) {
      console.error("Error creating advance/payment:", err);
      setError(err.message || "Failed to record transaction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/trustee/advances"
          className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 shadow-sm transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Record Cash Advance / Vendor Payment
          </h1>
          <p className="text-sm text-gray-500">
            Issue Type A cash advance with return expected, or Type B direct vendor payment with auto-voucher.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1.5 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("ADVANCE");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === "ADVANCE"
              ? "bg-emerald-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Type A — Cash Advance (With Return)
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("DIRECT_PAYMENT");
            setError(null);
          }}
          className={`flex-1 py-2.5 px-4 rounded-md text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
            activeTab === "DIRECT_PAYMENT"
              ? "bg-purple-600 text-white shadow"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Type B — Direct Vendor Payment (Instant Voucher)
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6"
      >
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Payee / Recipient */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Payee / Recipient Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={givenToName}
                onChange={(e) => setGivenToName(e.target.value)}
                placeholder={
                  activeTab === "ADVANCE"
                    ? "e.g. Krishna Vyas (Sevadar)"
                    : "e.g. Mahadev Stores / Ramesh Electrician"
                }
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Purpose */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Purpose / Description <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Purchasing vegetables and groceries for upcoming Bhandara"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Expense Category <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              {activeTab === "ADVANCE" ? "Advance Amount (₹)" : "Payment Amount (₹)"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="number"
                min="1"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Direct Payment Specific Fields */}
          {activeTab === "DIRECT_PAYMENT" && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Payment Mode <span className="text-rose-500">*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                >
                  {PAYMENT_MODES.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                  Payment Date
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              {paymentMode !== "CASH" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Reference / UTR / Cheque No
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="e.g. CHQ-882310 or UTR-30912..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                      Bank Name (Optional)
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. SBI / HDFC Bank"
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Additional Notes / Explanations (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved by Trustee Board during Tuesday review..."
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
          <Link
            to="/admin/trustee/advances"
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50 ${
              activeTab === "ADVANCE"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Processing...
              </>
            ) : activeTab === "ADVANCE" ? (
              <>
                <DollarSign className="w-4 h-4" /> Issue Cash Advance
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Record Payment & Create Voucher
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdvanceForm;
