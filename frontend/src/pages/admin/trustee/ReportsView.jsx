import { useState, useEffect, useCallback } from "react";
import { financeApi } from "../../../services/financeApi";

/**
 * ReportsView — ERP Phase 5
 *
 * Provides Trustee access to 5 critical financial reports:
 * 1. Cash Book (Chronological income/expense with running balance)
 * 2. Voucher Register (All expense vouchers by date and category)
 * 3. Outstanding Advances (Pending advances requiring settlement)
 * 4. Monthly Summary (Month-by-month income vs expenditure comparison)
 * 5. Annual Audit Export (Full year transaction dump for CA audit)
 *
 * Supports live viewing and CSV export for all reports.
 */
const ReportsView = () => {
  const [activeTab, setActiveTab] = useState("cash-book");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [category, setCategory] = useState("");

  // Report Data States
  const [cashBookData, setCashBookData] = useState({ entries: [], summary: {} });
  const [voucherData, setVoucherData] = useState({ vouchers: [], summary: {} });
  const [advancesData, setAdvancesData] = useState({ advances: [], summary: {} });
  const [monthlyData, setMonthlyData] = useState({ monthly: [], summary: {} });

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "cash-book") {
        const res = await financeApi.getCashBook({ startDate, endDate });
        if (res.success) setCashBookData(res.data);
      } else if (activeTab === "voucher-register") {
        const res = await financeApi.getVoucherRegisterReport({ startDate, endDate, category });
        if (res.success) setVoucherData(res.data);
      } else if (activeTab === "outstanding-advances") {
        const res = await financeApi.getOutstandingAdvancesReport();
        if (res.success) setAdvancesData(res.data);
      } else if (activeTab === "monthly-summary") {
        const res = await financeApi.getMonthlySummaryReport({ year });
        if (res.success) setMonthlyData(res.data);
      }
    } catch (err) {
      console.error("Failed to load report:", err);
      setError(err.message || "Failed to load report data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTab, startDate, endDate, category, year]);

  useEffect(() => {
    if (activeTab !== "annual-export") {
      fetchReport();
    }
  }, [activeTab, fetchReport]);

  const handleExportCsv = async () => {
    try {
      setLoading(true);
      const params = {};
      if (["cash-book", "voucher-register"].includes(activeTab)) {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (activeTab === "voucher-register" && category) params.category = category;
      } else if (["monthly-summary", "annual-export"].includes(activeTab)) {
        params.year = year;
      }

      await financeApi.downloadReportCsv(activeTab, params, `${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report CSV. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "---";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-sm text-gray-500 mt-1">
            Real-time accounting statements, registers, and CA audit exports
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV ({activeTab.replace("-", " ")})
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 flex flex-wrap gap-1">
        {[
          { id: "cash-book", label: "Cash Book" },
          { id: "voucher-register", label: "Voucher Register" },
          { id: "outstanding-advances", label: "Outstanding Advances" },
          { id: "monthly-summary", label: "Monthly Summary" },
          { id: "annual-export", label: "CA Audit Export" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setError(null);
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      {activeTab !== "outstanding-advances" && activeTab !== "annual-export" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap items-end gap-4">
          {["cash-book", "voucher-register"].includes(activeTab) && (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </>
          )}

          {activeTab === "voucher-register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="">All Categories</option>
                <option value="GROCERY">Grocery &amp; Provisions</option>
                <option value="UTILITIES">Electricity &amp; Water</option>
                <option value="MAINTENANCE">Ashram Maintenance</option>
                <option value="EVENT">Event &amp; Festival</option>
                <option value="ANNADAN">Annadan Expense</option>
                <option value="TRAVEL">Travel &amp; Fuel</option>
                <option value="SALARY">Sevadar Honorarium</option>
                <option value="OTHER">Other Expense</option>
              </select>
            </div>
          )}

          {activeTab === "monthly-summary" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Financial Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                {[2026, 2025, 2024, 2023].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={fetchReport}
              disabled={loading}
              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
                setCategory("");
                setYear(new Date().getFullYear().toString());
              }}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 text-sm underline"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Tab 1: Cash Book */}
      {activeTab === "cash-book" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold">
            <div className="flex items-center gap-6">
              <span className="text-emerald-700">Total Inflow: {formatCurrency(cashBookData.summary?.totalIncome)}</span>
              <span className="text-red-700">Total Outflow: {formatCurrency(cashBookData.summary?.totalExpense)}</span>
            </div>
            <span className="text-gray-900">
              Net Balance:{" "}
              <span className={cashBookData.summary?.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}>
                {formatCurrency(cashBookData.summary?.netBalance)}
              </span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Ref No</th>
                  <th className="py-3 px-4">Party</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4 text-right">Inflow (₹)</th>
                  <th className="py-3 px-4 text-right">Outflow (₹)</th>
                  <th className="py-3 px-4 text-right">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-500">Loading cash book entries...</td>
                  </tr>
                ) : cashBookData.entries?.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-12 text-center text-gray-500">No transactions found in this date range.</td>
                  </tr>
                ) : (
                  cashBookData.entries.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">{formatDate(item.date)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          item.type === "INCOME" || item.type === "ADVANCE_RETURN"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-gray-900">{item.reference}</td>
                      <td className="py-3 px-4 text-gray-800">{item.party}</td>
                      <td className="py-3 px-4 text-gray-600">{item.category}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{item.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                        {item.amountIn > 0 ? formatCurrency(item.amountIn) : "---"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-red-600">
                        {item.amountOut > 0 ? formatCurrency(item.amountOut) : "---"}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">
                        {formatCurrency(item.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Voucher Register */}
      {activeTab === "voucher-register" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-sm font-semibold">
            <span>Total Vouchers: {voucherData.summary?.count || 0}</span>
            <span className="text-red-700">Total Expenditure: {formatCurrency(voucherData.summary?.totalAmount)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">Voucher No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">Loading voucher register...</td>
                  </tr>
                ) : voucherData.vouchers?.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500">No expense vouchers found matching criteria.</td>
                  </tr>
                ) : (
                  voucherData.vouchers.map((v) => (
                    <tr key={v._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-medium text-amber-700">{v.voucherNumber}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">{formatDate(v.voucherDate || v.createdAt)}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{v.recipientName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                          {v.expenseCategory}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-600">{v.paymentMethod || "CASH"}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{v.narration || v.description || "---"}</td>
                      <td className="py-3 px-4 text-right font-bold text-red-600">{formatCurrency(v.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Outstanding Advances */}
      {activeTab === "outstanding-advances" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-sm font-semibold text-amber-900">
            <span>Pending Advances: {advancesData.summary?.count || 0}</span>
            <span>Total Outstanding Amount: {formatCurrency(advancesData.summary?.totalOutstanding)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">Advance No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Disbursed On</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Expected Settlement</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">Loading outstanding advances...</td>
                  </tr>
                ) : advancesData.advances?.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">All advances are settled! No outstanding balance.</td>
                  </tr>
                ) : (
                  advancesData.advances.map((a) => (
                    <tr key={a._id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono font-medium text-amber-700">{a.advanceNumber}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold">
                          {a.advanceType === "TYPE_A" ? "Cash Advance" : "Direct Pay"}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">{formatDate(a.createdAt)}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{a.recipientName}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{a.recipientMobile || "---"}</td>
                      <td className="py-3 px-4 text-gray-700 max-w-xs truncate">{a.purpose}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">{formatDate(a.expectedSettlementDate)}</td>
                      <td className="py-3 px-4 text-right font-bold text-amber-600">{formatCurrency(a.advanceAmount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Monthly Summary */}
      {activeTab === "monthly-summary" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold">
            <span>Year {monthlyData.year || year} Summary</span>
            <div className="flex items-center gap-6">
              <span className="text-emerald-700">Annual Income: {formatCurrency(monthlyData.summary?.totalYearIncome)}</span>
              <span className="text-red-700">Annual Expense: {formatCurrency(monthlyData.summary?.totalYearExpense)}</span>
              <span className={monthlyData.summary?.netYearBalance >= 0 ? "text-emerald-600 font-bold" : "text-red-600 font-bold"}>
                Net Balance: {formatCurrency(monthlyData.summary?.netYearBalance)}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-xs font-semibold border-b border-gray-200">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4 text-right">Income (Donations)</th>
                  <th className="py-3 px-4 text-right">Donation Count</th>
                  <th className="py-3 px-4 text-right">Expenditure (Vouchers)</th>
                  <th className="py-3 px-4 text-right">Voucher Count</th>
                  <th className="py-3 px-4 text-right">Net Monthly Flow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-gray-500">Loading monthly summary...</td>
                  </tr>
                ) : (
                  monthlyData.monthly?.map((m) => (
                    <tr key={m.monthNumber} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-semibold text-gray-900">{m.monthName}</td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">{formatCurrency(m.income)}</td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">{m.donationsCount}</td>
                      <td className="py-3 px-4 text-right font-medium text-red-600">{formatCurrency(m.expense)}</td>
                      <td className="py-3 px-4 text-right text-gray-500 text-xs">{m.vouchersCount}</td>
                      <td className={`py-3 px-4 text-right font-bold ${m.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(m.net)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Annual Audit Export */}
      {activeTab === "annual-export" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-2xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">CA Audit Complete Transaction Dump</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Generate a standardized, chronological CSV export containing every donation receipt, expense voucher, and cash advance settlement for the selected financial year. This dump is structured to comply with statutory accounting standards and Chartered Accountant audit requirements.
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <label className="text-sm font-semibold text-gray-700">Select Audit Year:</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-amber-500"
            >
              {[2026, 2025, 2024, 2023].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download {year} Annual CA Audit CSV
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
