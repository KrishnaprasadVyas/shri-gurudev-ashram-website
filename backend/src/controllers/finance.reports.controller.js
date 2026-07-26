const mongoose = require("mongoose");
const Donation = require("../models/Donation");
const Voucher = require("../models/Voucher");
const CashAdvance = require("../models/CashAdvance");

// Helper to convert rows to CSV string with RFC 4180 double quote escaping
function toCSV(headers, rows) {
  const headerLine = headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) =>
    row
      .map((cell) => {
        if (cell === null || cell === undefined) return '""';
        return `"${String(cell).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headerLine, ...dataLines].join("\n");
}

// Helper to parse date range
function getDateRange(query) {
  const { startDate, endDate, year } = query;
  const filter = {};

  if (startDate || endDate) {
    filter.$gte = startDate ? new Date(startDate) : new Date("2000-01-01");
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.$lte = end;
    } else {
      filter.$lte = new Date();
    }
  } else if (year) {
    const y = parseInt(year) || new Date().getFullYear();
    filter.$gte = new Date(`${y}-01-01T00:00:00.000Z`);
    filter.$lte = new Date(`${y}-12-31T23:59:59.999Z`);
  }
  return Object.keys(filter).length > 0 ? filter : null;
}

/**
 * 1. GET /api/finance/reports/cash-book
 * Chronological ledger of all cash/digital inflows and outflows with running balance.
 * Prevents double counting by excluding ADVANCE_SETTLEMENT vouchers (whose cash was already disbursed when advance issued).
 */
exports.getCashBook = async (req, res) => {
  try {
    const dateFilter = getDateRange(req.query);
    const donationQuery = { $or: [{ status: "SUCCESS" }, { "payment.status": "SUCCESS" }] };
    const voucherQuery = {};
    const advanceQuery = {};

    if (dateFilter) {
      donationQuery.createdAt = dateFilter;
      voucherQuery.createdAt = dateFilter;
      advanceQuery.createdAt = dateFilter;
    }

    const [donations, vouchers, advances] = await Promise.all([
      Donation.find(donationQuery).sort({ createdAt: 1 }).lean(),
      Voucher.find(voucherQuery).sort({ createdAt: 1 }).lean(),
      CashAdvance.find(advanceQuery).sort({ createdAt: 1 }).lean(),
    ]);

    const entries = [];

    // Inflows: Donations
    for (const d of donations) {
      let headName = "Donation";
      if (d.donationHead && typeof d.donationHead.name === "object") {
        headName = d.donationHead.name.en || Object.values(d.donationHead.name)[0];
      } else if (d.donationHead && d.donationHead.name) {
        headName = d.donationHead.name;
      }
      entries.push({
        id: d._id.toString(),
        date: d.createdAt || d.paymentDate,
        type: "INCOME",
        category: headName,
        reference: d.receiptNumber || d._id.toString().slice(-8),
        party: d.donor?.anonymousDisplay ? "Anonymous (Gupt Seva)" : (d.donor?.name || "Devotee"),
        amountIn: d.amount || 0,
        amountOut: 0,
        paymentMethod: d.paymentMethod || d.payment?.method || "ONLINE",
        details: `Donation for ${headName}`,
      });
    }

    // Outflows: Expense Vouchers (Excluding ADVANCE_SETTLEMENT to avoid double-counting with initial Advance disbursement)
    for (const v of vouchers) {
      if (v.sourceType === "ADVANCE_SETTLEMENT") {
        continue; // Cash left ashram when advance was given
      }
      const amt = v.actualAmount !== undefined && v.actualAmount !== null ? v.actualAmount : (v.amount || 0);
      entries.push({
        id: v._id.toString(),
        date: v.date || v.voucherDate || v.createdAt,
        type: "EXPENSE",
        category: v.category || v.expenseCategory || "General Expense",
        reference: v.voucherNumber || v._id.toString().slice(-8),
        party: v.personName || v.recipientName || "Vendor",
        amountIn: 0,
        amountOut: amt,
        paymentMethod: v.paymentMode || v.paymentMethod || "CASH",
        details: v.title || v.narration || v.description || "Expense Voucher",
      });
    }

    // Outflows / Inflows: Cash Advances (Type A / ADVANCE)
    for (const a of advances) {
      const isTypeA = a.type === "ADVANCE" || a.advanceType === "TYPE_A";
      if (isTypeA) {
        // Initial disbursement outflow
        entries.push({
          id: a._id.toString(),
          date: a.createdAt || a.expectedSettlementDate,
          type: "ADVANCE_OUT",
          category: "Cash Advance",
          reference: a.advanceNumber || a._id.toString().slice(-8),
          party: a.givenTo?.name || a.recipientName || "Staff/Sevadar",
          amountIn: 0,
          amountOut: a.advanceAmount || 0,
          paymentMethod: "CASH",
          details: `Advance: ${a.purpose}`,
        });

        // If settled with return amount, record return inflow
        const retAmt = a.settlement?.returnedAmount !== undefined && a.settlement?.returnedAmount !== null
          ? a.settlement.returnedAmount
          : (a.returnedAmount || 0);

        if (a.status === "SETTLED" && retAmt > 0) {
          entries.push({
            id: a._id.toString() + "_ret",
            date: a.settlement?.settledAt || a.settledAt || a.updatedAt,
            type: "ADVANCE_RETURN",
            category: "Advance Settlement Return",
            reference: a.advanceNumber + "-RET",
            party: a.givenTo?.name || a.recipientName || "Staff/Sevadar",
            amountIn: retAmt,
            amountOut: 0,
            paymentMethod: a.settlement?.paymentMode || "CASH",
            details: `Unspent cash returned from advance ${a.advanceNumber}`,
          });
        }
      }
    }

    // Sort chronologically ascending
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Compute running balance
    let runningBalance = 0;
    let totalIncome = 0;
    let totalExpense = 0;

    for (const entry of entries) {
      runningBalance += entry.amountIn - entry.amountOut;
      entry.runningBalance = runningBalance;
      totalIncome += entry.amountIn;
      totalExpense += entry.amountOut;
    }

    // Handle CSV export
    if (req.query.export === "csv") {
      const headers = ["Date", "Type", "Reference", "Party", "Category", "Payment Method", "Inflow (₹)", "Outflow (₹)", "Balance (₹)", "Details"];
      const rows = entries.map((e) => [
        new Date(e.date).toISOString().split("T")[0],
        e.type,
        e.reference,
        e.party,
        e.category,
        e.paymentMethod,
        e.amountIn || "",
        e.amountOut || "",
        e.runningBalance,
        e.details,
      ]);
      const csvData = toCSV(headers, rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="ashram_cash_book_${new Date().toISOString().slice(0,10)}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(200).json({
      success: true,
      data: {
        entries: entries.reverse(), // Reverse for UI display (newest first)
        summary: {
          totalIncome,
          totalExpense,
          netBalance: totalIncome - totalExpense,
          count: entries.length,
        },
      },
    });
  } catch (err) {
    console.error("Error in getCashBook:", err);
    return res.status(500).json({ success: false, message: "Failed to generate Cash Book report." });
  }
};

/**
 * 2. GET /api/finance/reports/voucher-register
 * Itemized register of all expense vouchers filterable by category and date.
 */
exports.getVoucherRegister = async (req, res) => {
  try {
    const dateFilter = getDateRange(req.query);
    const query = {};
    if (dateFilter) {
      query.createdAt = dateFilter;
    }
    if (req.query.category) {
      query.$or = [{ category: req.query.category }, { expenseCategory: req.query.category }];
    }

    const rawVouchers = await Voucher.find(query)
      .sort({ date: -1, voucherDate: -1, createdAt: -1 })
      .lean();

    let totalAmount = 0;
    const categoryTotals = {};

    const vouchers = rawVouchers.map((v) => {
      const amt = v.actualAmount !== undefined && v.actualAmount !== null ? v.actualAmount : (v.amount || 0);
      const cat = v.category || v.expenseCategory || "Other";
      const person = v.personName || v.recipientName || "Vendor";
      const mode = v.paymentMode || v.paymentMethod || "CASH";
      const desc = v.title || v.narration || v.description || "";
      const date = v.date || v.voucherDate || v.createdAt;

      totalAmount += amt;
      categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;

      return {
        ...v,
        amount: amt,
        actualAmount: amt,
        recipientName: person,
        personName: person,
        expenseCategory: cat,
        category: cat,
        paymentMethod: mode,
        paymentMode: mode,
        narration: desc,
        title: desc,
        voucherDate: date,
        date: date,
      };
    });

    if (req.query.export === "csv") {
      const headers = ["Voucher No", "Date", "Recipient", "Category", "Amount (₹)", "Payment Method", "Narration", "Created By"];
      const rows = vouchers.map((v) => [
        v.voucherNumber,
        new Date(v.voucherDate).toISOString().split("T")[0],
        v.recipientName,
        v.expenseCategory,
        v.amount,
        v.paymentMethod,
        v.narration,
        v.createdBy?.name || v.preparedBy || "Admin",
      ]);
      const csvData = toCSV(headers, rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="voucher_register_${new Date().toISOString().slice(0,10)}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(200).json({
      success: true,
      data: {
        vouchers,
        summary: {
          totalAmount,
          count: vouchers.length,
          categoryTotals,
        },
      },
    });
  } catch (err) {
    console.error("Error in getVoucherRegister:", err);
    return res.status(500).json({ success: false, message: "Failed to load Voucher Register." });
  }
};

/**
 * 3. GET /api/finance/reports/outstanding-advances
 * Advances in OPEN status (not yet settled).
 */
exports.getOutstandingAdvances = async (req, res) => {
  try {
    const query = { status: "OPEN" };
    const rawAdvances = await CashAdvance.find(query)
      .sort({ createdAt: -1 })
      .lean();

    let totalOutstanding = 0;

    const advances = rawAdvances.map((a) => {
      const amt = a.advanceAmount || 0;
      totalOutstanding += amt;
      const isTypeA = a.type === "ADVANCE" || a.advanceType === "TYPE_A";

      return {
        ...a,
        advanceType: isTypeA ? "TYPE_A" : "TYPE_B",
        recipientName: a.givenTo?.name || a.recipientName || "Sevadar",
        recipientMobile: a.givenTo?.mobile || a.recipientMobile || "",
        advanceAmount: amt,
      };
    });

    if (req.query.export === "csv") {
      const headers = ["Advance No", "Type", "Date", "Recipient", "Mobile", "Amount (₹)", "Purpose", "Expected Settlement Date"];
      const rows = advances.map((a) => [
        a.advanceNumber,
        a.advanceType === "TYPE_A" ? "Cash Advance" : "Direct Payment",
        new Date(a.createdAt).toISOString().split("T")[0],
        a.recipientName,
        a.recipientMobile || "",
        a.advanceAmount,
        a.purpose,
        a.expectedSettlementDate ? new Date(a.expectedSettlementDate).toISOString().split("T")[0] : "",
      ]);
      const csvData = toCSV(headers, rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="outstanding_advances_${new Date().toISOString().slice(0,10)}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(200).json({
      success: true,
      data: {
        advances,
        summary: {
          totalOutstanding,
          count: advances.length,
        },
      },
    });
  } catch (err) {
    console.error("Error in getOutstandingAdvances:", err);
    return res.status(500).json({ success: false, message: "Failed to load Outstanding Advances." });
  }
};

/**
 * 4. GET /api/finance/reports/monthly-summary
 * Income (donations) vs Expenditure (vouchers) per month for a given year.
 */
exports.getMonthlySummary = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [donations, vouchers] = await Promise.all([
      Donation.find({
        $or: [{ status: "SUCCESS" }, { "payment.status": "SUCCESS" }],
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }).lean(),
      Voucher.find({
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }).lean(),
    ]);

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const monthlyData = months.map((name, idx) => ({
      monthNumber: idx + 1,
      monthName: name,
      income: 0,
      expense: 0,
      net: 0,
      donationsCount: 0,
      vouchersCount: 0,
    }));

    for (const d of donations) {
      const m = new Date(d.createdAt || d.paymentDate || new Date()).getMonth();
      monthlyData[m].income += d.amount || 0;
      monthlyData[m].donationsCount += 1;
    }

    for (const v of vouchers) {
      const amt = v.actualAmount !== undefined && v.actualAmount !== null ? v.actualAmount : (v.amount || 0);
      const m = new Date(v.date || v.voucherDate || v.createdAt || new Date()).getMonth();
      monthlyData[m].expense += amt;
      monthlyData[m].vouchersCount += 1;
    }

    let totalYearIncome = 0;
    let totalYearExpense = 0;

    for (const m of monthlyData) {
      m.net = m.income - m.expense;
      totalYearIncome += m.income;
      totalYearExpense += m.expense;
    }

    if (req.query.export === "csv") {
      const headers = ["Month", "Income (₹)", "Expense (₹)", "Net Balance (₹)", "Donations Count", "Vouchers Count"];
      const rows = monthlyData.map((m) => [
        m.monthName,
        m.income,
        m.expense,
        m.net,
        m.donationsCount,
        m.vouchersCount,
      ]);
      const csvData = toCSV(headers, rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="monthly_summary_${year}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(200).json({
      success: true,
      data: {
        year,
        monthly: monthlyData,
        summary: {
          totalYearIncome,
          totalYearExpense,
          netYearBalance: totalYearIncome - totalYearExpense,
        },
      },
    });
  } catch (err) {
    console.error("Error in getMonthlySummary:", err);
    return res.status(500).json({ success: false, message: "Failed to generate Monthly Summary." });
  }
};

/**
 * 5. GET /api/finance/reports/annual-export
 * Complete accounting transaction dump structured for Chartered Accountant audit compliance.
 */
exports.getAnnualExport = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear = new Date(`${year}-12-31T23:59:59.999Z`);

    const [donations, vouchers, advances] = await Promise.all([
      Donation.find({
        $or: [{ status: "SUCCESS" }, { "payment.status": "SUCCESS" }],
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }).sort({ createdAt: 1 }).lean(),
      Voucher.find({ createdAt: { $gte: startOfYear, $lte: endOfYear } }).sort({ createdAt: 1 }).lean(),
      CashAdvance.find({ createdAt: { $gte: startOfYear, $lte: endOfYear } }).sort({ createdAt: 1 }).lean(),
    ]);

    const allRows = [];

    for (const d of donations) {
      let headName = "Donation";
      if (d.donationHead && typeof d.donationHead.name === "object") {
        headName = d.donationHead.name.en || Object.values(d.donationHead.name)[0];
      } else if (d.donationHead && d.donationHead.name) {
        headName = d.donationHead.name;
      }
      allRows.push({
        date: d.createdAt || d.paymentDate,
        type: "DONATION_RECEIPT",
        ref: d.receiptNumber || d._id.toString().slice(-8),
        party: d.donor?.anonymousDisplay ? "Anonymous (Gupt Seva)" : (d.donor?.name || "Devotee"),
        pan: d.donor?.idNumber || "",
        category: headName,
        inflow: d.amount || 0,
        outflow: 0,
        mode: d.paymentMethod || d.payment?.method || "ONLINE",
        details: `Donation for ${headName}`,
        status: d.status || d.payment?.status || "SUCCESS",
      });
    }

    for (const v of vouchers) {
      const amt = v.actualAmount !== undefined && v.actualAmount !== null ? v.actualAmount : (v.amount || 0);
      allRows.push({
        date: v.date || v.voucherDate || v.createdAt,
        type: "EXPENSE_VOUCHER",
        ref: v.voucherNumber,
        party: v.personName || v.recipientName || "Vendor",
        pan: "",
        category: v.category || v.expenseCategory || "General",
        inflow: 0,
        outflow: amt,
        mode: v.paymentMode || v.paymentMethod || "CASH",
        details: v.title || v.narration || v.description || "",
        status: "APPROVED",
      });
    }

    for (const a of advances) {
      const isTypeA = a.type === "ADVANCE" || a.advanceType === "TYPE_A";
      if (!isTypeA) continue; // Direct payments are already listed in Vouchers loop
      allRows.push({
        date: a.createdAt,
        type: "CASH_ADVANCE",
        ref: a.advanceNumber,
        party: a.givenTo?.name || a.recipientName || "Staff/Sevadar",
        pan: "",
        category: a.category || "Cash Advance",
        inflow: 0,
        outflow: a.advanceAmount || 0,
        mode: "CASH",
        details: `Purpose: ${a.purpose}`,
        status: a.status,
      });

      const retAmt = a.settlement?.returnedAmount !== undefined && a.settlement?.returnedAmount !== null
        ? a.settlement.returnedAmount
        : (a.returnedAmount || 0);

      const expAmt = a.settlement?.actualExpense !== undefined && a.settlement?.actualExpense !== null
        ? a.settlement.actualExpense
        : (a.actualExpense || 0);

      if (a.status === "SETTLED" && retAmt > 0) {
        allRows.push({
          date: a.settlement?.settledAt || a.settledAt || a.updatedAt,
          type: "ADVANCE_SETTLEMENT_RETURN",
          ref: a.advanceNumber + "-RET",
          party: a.givenTo?.name || a.recipientName || "Staff/Sevadar",
          pan: "",
          category: "Settlement Return",
          inflow: retAmt,
          outflow: 0,
          mode: a.settlement?.paymentMode || "CASH",
          details: `Settled with actual expense ₹${expAmt}, returned ₹${retAmt}`,
          status: "SETTLED",
        });
      }
    }

    allRows.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (req.query.export === "csv") {
      const headers = ["Date", "Transaction Type", "Ref No", "Party Name", "PAN", "Category", "Inflow (₹)", "Outflow (₹)", "Payment Mode", "Details", "Status"];
      const rows = allRows.map((r) => [
        new Date(r.date).toISOString().split("T")[0],
        r.type,
        r.ref,
        r.party,
        r.pan,
        r.category,
        r.inflow || "",
        r.outflow || "",
        r.mode,
        r.details,
        r.status,
      ]);
      const csvData = toCSV(headers, rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="annual_ca_audit_export_${year}.csv"`);
      return res.status(200).send(csvData);
    }

    return res.status(200).json({
      success: true,
      data: {
        year,
        transactions: allRows,
        count: allRows.length,
      },
    });
  } catch (err) {
    console.error("Error in getAnnualExport:", err);
    return res.status(500).json({ success: false, message: "Failed to generate Annual CA Export." });
  }
};

/**
 * 6. GET /api/finance/reports/dashboard-stats
 * Real-time summary metrics for Trustee Home dashboard.
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const now = req.query.date ? new Date(req.query.date) : new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    const [openAdvancesResult, todayDonationsResult, monthDonationsResult, monthVouchersResult] = await Promise.all([
      CashAdvance.aggregate([
        { $match: { status: "OPEN" } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$advanceAmount" } } }
      ]),
      Donation.aggregate([
        { $match: {
            $or: [{ status: "SUCCESS" }, { "payment.status": "SUCCESS" }],
            createdAt: { $gte: startOfToday }
        } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } }
      ]),
      Donation.aggregate([
        { $match: {
            $or: [{ status: "SUCCESS" }, { "payment.status": "SUCCESS" }],
            createdAt: { $gte: startOfMonth }
        } },
        { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } } }
      ]),
      Voucher.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: {
            _id: null,
            count: { $sum: 1 },
            total: { $sum: { $ifNull: ["$actualAmount", "$amount"] } }
        } }
      ])
    ]);

    const openAdvancesCount = openAdvancesResult[0]?.count || 0;
    const openAdvancesTotal = openAdvancesResult[0]?.total || 0;
    const todayDonationsCount = todayDonationsResult[0]?.count || 0;
    const todayDonationsTotal = todayDonationsResult[0]?.total || 0;
    const monthDonationsCount = monthDonationsResult[0]?.count || 0;
    const monthDonationsTotal = monthDonationsResult[0]?.total || 0;
    const monthVouchersCount = monthVouchersResult[0]?.count || 0;
    const monthVouchersTotal = monthVouchersResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      data: {
        openAdvancesCount,
        openAdvancesTotal,
        todayDonationsCount,
        todayDonationsTotal,
        monthDonationsCount,
        monthDonationsTotal,
        monthVouchersCount,
        monthVouchersTotal,
        netMonthBalance: monthDonationsTotal - monthVouchersTotal,
      },
    });
  } catch (err) {
    console.error("Error in getDashboardStats:", err);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard statistics." });
  }
};
