import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  FileText,
  User,
  Calendar,
  Building,
  Tag,
  CreditCard,
  AlertCircle,
  Printer,
  CheckCircle2,
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

const VoucherDetail = () => {
  const { id } = useParams();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        const res = await financeApi.getVoucherById(id);
        setVoucher(res.data);
      } catch (err) {
        setError(err.message || "Failed to load voucher details.");
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!voucher) return;
    setDownloading(true);
    try {
      await financeApi.downloadVoucherPdf(voucher._id, voucher.voucherNumber);
    } catch (err) {
      alert(err.message || "Failed to download voucher PDF.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-gray-500">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
        Loading expense voucher...
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
        <p className="font-bold">Expense Voucher Not Found</p>
        <Link
          to="/admin/trustee/vouchers"
          className="inline-block mt-3 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg"
        >
          Back to Vouchers Register
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/trustee/vouchers"
            className="p-2 bg-white hover:bg-gray-50 text-gray-600 rounded-lg border border-gray-200 shadow-sm transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-gray-900 font-mono">
                {voucher.voucherNumber}
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase">
                Official Record
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Generated on{" "}
              {new Date(voucher.date || voucher.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download Official PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Voucher Document Box (Printable Styling) */}
      <div className="bg-white rounded-xl shadow-md border-2 border-emerald-900/10 p-8 space-y-8">
        {/* Ashram Brand Header */}
        <div className="text-center border-b-2 border-gray-200 pb-6">
          <h2 className="text-2xl font-black text-emerald-900 tracking-wide">
            SHRI GURUDEV ASHRAM
          </h2>
          <p className="text-xs font-semibold text-gray-600 tracking-widest uppercase mt-1">
            Official Expense Voucher & Accounting Register
          </p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 font-semibold block">VOUCHER NO</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              {voucher.voucherNumber}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">DATE</span>
            <span className="font-bold text-gray-900 text-sm">
              {new Date(voucher.date || voucher.createdAt).toLocaleDateString("en-IN")}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">SOURCE TYPE</span>
            <span className="font-bold text-gray-900 text-sm">
              {voucher.sourceType === "DIRECT_PAYMENT" ? "Direct Pay" : "Settlement"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">CATEGORY</span>
            <span className="font-bold text-emerald-800 text-sm">
              {CATEGORY_LABELS[voucher.category] || voucher.category}
            </span>
          </div>
        </div>

        {/* Payee & Title */}
        <div className="border border-gray-200 rounded-lg p-5 bg-emerald-50/20 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Payee / Recipient Name
              </span>
              <p className="text-lg font-bold text-gray-900 mt-0.5">
                {voucher.personName}
              </p>
            </div>
            {voucher.preparedBy && (
              <div className="text-right">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Prepared By
                </span>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {voucher.preparedBy.name}
                </p>
              </div>
            )}
          </div>
          <div className="pt-2 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Expense Title / Purpose
            </span>
            <p className="text-base font-semibold text-gray-800 mt-0.5">
              {voucher.title}
            </p>
          </div>
        </div>

        {/* Financial Highlights Table */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Financial Highlights
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <span className="text-xs font-semibold text-gray-600 block">
                Advance Given
              </span>
              <span className="text-lg font-black text-gray-900 font-mono mt-1 block">
                {voucher.advanceAmount !== null && voucher.advanceAmount !== undefined
                  ? `₹${Number(voucher.advanceAmount).toLocaleString("en-IN")}`
                  : "N/A"}
              </span>
            </div>
            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200 text-center">
              <span className="text-xs font-semibold text-emerald-800 block">
                Actual Spent (Voucher Amt)
              </span>
              <span className="text-2xl font-black text-emerald-900 font-mono mt-1 block">
                ₹{Number(voucher.actualAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
              <span className="text-xs font-semibold text-gray-600 block">
                Amount Returned
              </span>
              <span className="text-lg font-black text-gray-900 font-mono mt-1 block">
                {voucher.returnedAmount !== null && voucher.returnedAmount !== undefined
                  ? `₹${Number(voucher.returnedAmount).toLocaleString("en-IN")}`
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Line Items Table */}
        {voucher.items && voucher.items.length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
              Itemized Line Items
            </h4>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase font-semibold">
                    <th className="py-2.5 px-4 w-12">#</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {voucher.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">
                        {CATEGORY_LABELS[item.category] || item.category}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-gray-900">
                        ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
          <div>
            <span className="text-gray-500 font-semibold block">PAYMENT MODE</span>
            <span className="font-bold text-gray-900 text-sm">
              {voucher.paymentMode || "CASH"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">REF / CHEQUE</span>
            <span className="font-bold text-gray-900 text-sm">
              {voucher.paymentRef || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">BANK NAME</span>
            <span className="font-bold text-gray-900 text-sm">
              {voucher.bankName || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500 font-semibold block">PAYMENT DATE</span>
            <span className="font-bold text-gray-900 text-sm">
              {voucher.paymentDate
                ? new Date(voucher.paymentDate).toLocaleDateString("en-IN")
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-12 grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <div className="border-t border-gray-400 pt-2 w-48 mx-auto">
              <p className="font-bold text-gray-900">Prepared By</p>
              <p className="text-gray-500 mt-0.5">
                {voucher.preparedBy?.name || "Authorized Sevadar"}
              </p>
            </div>
          </div>
          <div>
            <div className="border-t border-gray-400 pt-2 w-48 mx-auto">
              <p className="font-bold text-gray-900">
                Trustee / Authorized Signatory
              </p>
              <p className="text-gray-500 mt-0.5">Shri Gurudev Ashram Board</p>
            </div>
          </div>
        </div>

        {/* System stamp */}
        <div className="text-center pt-4 border-t border-gray-100 text-[11px] text-gray-400 italic">
          This is a computer-generated accounting voucher. An immutable copy is archived in the ashram ERP database.
        </div>
      </div>
    </div>
  );
};

export default VoucherDetail;
