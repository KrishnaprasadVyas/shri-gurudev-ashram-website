import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  DollarSign,
  FileText,
  Tag,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
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

const SettleAdvanceForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [advance, setAdvance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [actualExpense, setActualExpense] = useState("");
  const [returnedAmount, setReturnedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchAdvance = async () => {
      try {
        const res = await financeApi.getAdvanceById(id);
        const adv = res.data;
        setAdvance(adv);
        if (adv) {
          setActualExpense(adv.advanceAmount || 0);
          setReturnedAmount(0);
          setItems([
            {
              description: adv.purpose || "",
              amount: adv.advanceAmount || 0,
              category: adv.category || "GROCERIES_PROVISIONS",
            },
          ]);
        }
      } catch (err) {
        setError(err.message || "Failed to load advance details.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdvance();
  }, [id]);

  const advAmount = Number(advance?.advanceAmount || 0);
  const expAmount = Number(actualExpense || 0);
  const retAmount = Number(returnedAmount || 0);
  const variance = advAmount - expAmount - retAmount;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        description: "",
        amount: "",
        category: advance?.category || "GROCERIES_PROVISIONS",
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const next = items.filter((_, i) => i !== index);
    setItems(next);
  };

  const handleItemChange = (index, field, val) => {
    const next = [...items];
    next[index][field] = field === "amount" ? Number(val) : val;
    setItems(next);

    if (field === "amount") {
      const sum = next.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
      setActualExpense(sum);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (retAmount > advAmount) {
      setError("Returned amount cannot exceed the advance given.");
      setSubmitting(false);
      return;
    }

    if (Math.abs(variance) > 1 && !notes.trim()) {
      setError(
        `There is an accounting variance of ₹${variance}. Please provide an explanatory note.`
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await financeApi.settleAdvance(id, {
        actualExpense: expAmount,
        returnedAmount: retAmount,
        paymentMode,
        paymentRef: paymentRef.trim(),
        notes: notes.trim(),
        items: items.filter((it) => it.description && it.amount > 0),
      });

      const voucherId = res.data?.voucher?._id;
      if (voucherId) {
        navigate(`/admin/trustee/vouchers/${voucherId}`);
      } else {
        navigate("/admin/trustee/advances");
      }
    } catch (err) {
      console.error("Error settling advance:", err);
      setError(err.message || "Failed to settle advance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        Loading advance details...
      </div>
    );
  }

  if (!advance) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
        <p className="font-bold">Cash Advance Not Found</p>
        <Link
          to="/admin/trustee/advances"
          className="inline-block mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg"
        >
          Back to Advances
        </Link>
      </div>
    );
  }

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
            Settle Cash Advance ({advance.advanceNumber})
          </h1>
          <p className="text-sm text-gray-500">
            Record actual expenditures, cash returns, and auto-generate the official expense voucher.
          </p>
        </div>
      </div>

      {/* Advance Summary Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200/60 px-2 py-0.5 rounded">
            Advance Summary
          </span>
          <h3 className="text-lg font-bold text-gray-900 mt-1">
            {advance.givenTo?.name} — {advance.purpose}
          </h3>
          <p className="text-xs text-gray-600 mt-0.5 font-mono">
            Issued on{" "}
            {new Date(advance.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs text-emerald-800 font-semibold uppercase">
            Total Advance Given
          </p>
          <p className="text-2xl font-black text-emerald-900 font-mono">
            ₹{advAmount.toLocaleString("en-IN")}
          </p>
        </div>
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

        {/* Financial Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Actual Spent (Voucher Amt) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={actualExpense}
              onChange={(e) => setActualExpense(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-gray-900 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Cash Returned to Ashram <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={returnedAmount}
              onChange={(e) => setReturnedAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-gray-900 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-xs font-semibold text-gray-600">
              Accounting Variance
            </span>
            <span
              className={`text-lg font-black font-mono mt-0.5 ${
                Math.abs(variance) > 1
                  ? "text-rose-600 font-bold"
                  : "text-emerald-700"
              }`}
            >
              ₹{variance.toLocaleString("en-IN")}
            </span>
            {Math.abs(variance) > 1 && (
              <span className="text-[10px] text-rose-600 font-semibold mt-0.5">
                Note required for variance!
              </span>
            )}
          </div>
        </div>

        {/* Itemized Line Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h4 className="text-sm font-bold text-gray-900">
              Itemized Line Items (Voucher Breakdown)
            </h4>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200"
              >
                <input
                  type="text"
                  placeholder="Item description..."
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(idx, "description", e.target.value)
                  }
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <select
                  value={item.category}
                  onChange={(e) =>
                    handleItemChange(idx, "category", e.target.value)
                  }
                  className="w-48 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="₹ Amount"
                  value={item.amount}
                  onChange={(e) =>
                    handleItemChange(idx, "amount", e.target.value)
                  }
                  className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm font-semibold bg-white focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment & Return Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Settlement / Return Mode
            </label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
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
              Reference / Cheque / UTR No (If Applicable)
            </label>
            <input
              type="text"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="e.g. UTR-991201 or Cash return"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
            Settlement Notes / Explanations{" "}
            {Math.abs(variance) > 1 && <span className="text-rose-500">*</span>}
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Balance ₹200 returned in cash to kitchen account..."
            className={`w-full p-3 border rounded-lg text-sm focus:ring-2 outline-none ${
              Math.abs(variance) > 1 && !notes.trim()
                ? "border-rose-400 focus:ring-rose-500 bg-rose-50/30"
                : "border-gray-300 focus:ring-emerald-500"
            }`}
          />
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
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {submitting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Settling & Generating Voucher...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Confirm Settlement & Generate
                Voucher
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettleAdvanceForm;
