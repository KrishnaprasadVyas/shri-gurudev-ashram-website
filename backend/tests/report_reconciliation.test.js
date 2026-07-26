const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const assert = require("assert");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { mainDb } = connectDB;
const Donation = require("../src/models/Donation");
const Voucher = require("../src/models/Voucher");
const CashAdvance = require("../src/models/CashAdvance");
const AuditLog = require("../src/models/AuditLog");
const cashAdvanceController = require("../src/controllers/cashAdvance.controller");
const financeReportsController = require("../src/controllers/finance.reports.controller");

// Helper to mock req/res for controllers
function mockReqRes(body = {}, query = {}, params = {}, user = { id: new mongoose.Types.ObjectId() }) {
  const req = {
    body,
    query,
    params,
    user,
    ip: "127.0.0.1",
    headers: { "user-agent": "ReconciliationTestSuite/1.0" },
  };

  let statusCode = 200;
  let responseData = null;
  let headers = {};

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    send(data) {
      responseData = data;
      return this;
    },
    setHeader(key, val) {
      headers[key] = val;
      return this;
    },
    getResult() {
      return { statusCode, data: responseData, headers };
    },
  };

  return { req, res };
}

async function runReconciliationSuite() {
  console.log("=======================================================================================");
  console.log("                   ASHRAM ERP — PHASE 5 REPORT RECONCILIATION SUITE                    ");
  console.log("=======================================================================================\n");

  console.log("⏳ Connecting to MongoDB...");
  await connectDB();
  console.log("✅ MongoDB connected successfully.\n");

  const createdDonationIds = [];
  const createdAdvanceIds = [];
  const createdVoucherIds = [];
  const testYear = 2029;
  const testDate = new Date(`${testYear}-07-15T10:00:00.000Z`);

  let passedCount = 0;
  let failedCount = 0;
  const reconciliationResults = [];

  function recordResult(reportName, metric, expected, actual) {
    const pass = expected === actual;
    if (pass) passedCount++;
    else failedCount++;
    reconciliationResults.push({
      report: reportName,
      metric,
      expected,
      actual,
      status: pass ? "PASS" : "FAIL",
    });
    console.log(`[${pass ? "✅ PASS" : "❌ FAIL"}] ${reportName} — ${metric}: Expected=${expected}, Actual=${actual}`);
  }

  try {
    console.log(`📌 Checking baseline stats before test...`);
    const { req: reqBase, res: resBase } = mockReqRes({}, { date: testDate.toISOString() });
    await financeReportsController.getDashboardStats(reqBase, resBase);
    const baseDash = resBase.getResult().data.data;
    const baseOpenAdvancesCount = baseDash.openAdvancesCount || 0;
    const baseOpenAdvancesTotal = baseDash.openAdvancesTotal || 0;

    console.log(`\n=======================================================================================`);
    console.log(`🏗️  CREATING DETERMINISTIC CONTROLLED DATASET (YEAR ${testYear})`);
    console.log(`=======================================================================================`);

    // 1. Donation: ₹1,000 (Cash)
    console.log("1️⃣  Creating Donation 1: ₹1,000 (Cash)...");
    const [don1] = await Donation.create([{
      donor: { name: "Reconciliation Donor Cash", mobile: "9876543210", dob: new Date("1980-01-01"), idType: "PAN", idNumber: "RECON1234F" },
      donationHead: { id: "HEAD1", name: "Annadan Seva" },
      amount: 1000,
      paymentMethod: "CASH",
      payment: { method: "CASH", status: "SUCCESS" },
      status: "SUCCESS",
      receiptNumber: "RECON-CA-001",
      createdAt: testDate,
    }]);
    createdDonationIds.push(don1._id);

    // 2. Donation: ₹500 (UPI)
    console.log("2️⃣  Creating Donation 2: ₹500 (UPI)...");
    const [don2] = await Donation.create([{
      donor: { name: "Reconciliation Donor UPI", mobile: "9876543211", dob: new Date("1980-01-01"), idType: "PAN", idNumber: "RECON1234F" },
      donationHead: { id: "HEAD2", name: "Gaushala Seva" },
      amount: 500,
      paymentMethod: "UPI",
      payment: { method: "UPI", status: "SUCCESS", utrNumber: "UPI999888777" },
      status: "SUCCESS",
      receiptNumber: "RECON-UPI-001",
      createdAt: new Date(`${testYear}-07-15T11:00:00.000Z`),
    }]);
    createdDonationIds.push(don2._id);

    // 3. Cash Advance: ₹300
    console.log("3️⃣  Creating Cash Advance (Type A): ₹300...");
    const { req: reqAdv, res: resAdv } = mockReqRes({
      givenToName: "Reconciliation Sevadar",
      purpose: "Provisions Advance",
      category: "GROCERIES_PROVISIONS",
      advanceAmount: 300,
    });
    await cashAdvanceController.createAdvance(reqAdv, resAdv);
    const advResult = resAdv.getResult();
    assert.strictEqual(advResult.statusCode, 201, `Advance creation must succeed: ${JSON.stringify(advResult.data)}`);
    const advanceDoc = advResult.data.data;
    createdAdvanceIds.push(advanceDoc._id);

    // Force date to Year 2029 for testing using raw collection
    await mainDb.collection("cashadvances").updateOne({ _id: advanceDoc._id }, { $set: { createdAt: new Date(`${testYear}-07-15T12:00:00.000Z`) } });

    // 4. Settlement: Expense ₹250, Return ₹50
    console.log("4️⃣  Settling Advance: Expense ₹250, Return ₹50...");
    const { req: reqSet, res: resSet } = mockReqRes({
      actualExpense: 250,
      returnedAmount: 50,
      paymentMode: "CASH",
      notes: "Settled reconciliation test advance",
      items: [{ description: "Provisions purchased", amount: 250, category: "GROCERIES_PROVISIONS" }],
    }, {}, { id: advanceDoc._id.toString() });
    await cashAdvanceController.settleAdvance(reqSet, resSet);
    const setResult = resSet.getResult();
    assert.strictEqual(setResult.statusCode, 200, `Advance settlement must succeed: ${JSON.stringify(setResult.data)}`);
    const settlementVoucherNo = setResult.data.data.voucher.voucherNumber;
    const setVch = await Voucher.findOne({ voucherNumber: settlementVoucherNo });
    createdVoucherIds.push(setVch._id);

    // Force settlement dates to Year 2029 using raw collection to bypass immutability hooks in tests
    await mainDb.collection("vouchers").updateOne({ _id: setVch._id }, { $set: { date: new Date(`${testYear}-07-15T13:00:00.000Z`), createdAt: new Date(`${testYear}-07-15T13:00:00.000Z`) } });
    await mainDb.collection("cashadvances").updateOne({ _id: advanceDoc._id }, { $set: { "settlement.settledAt": new Date(`${testYear}-07-15T13:00:00.000Z`), updatedAt: new Date(`${testYear}-07-15T13:00:00.000Z`) } });

    // 5. Direct Vendor Payment: ₹400
    console.log("5️⃣  Creating Direct Vendor Payment: ₹400...");
    const { req: reqDir, res: resDir } = mockReqRes({
      givenToName: "Reconciliation Vendor",
      purpose: "Plumbing repairs",
      category: "MAINTENANCE_REPAIRS",
      actualAmount: 400,
      paymentMode: "CASH",
    });
    await cashAdvanceController.createDirectPayment(reqDir, resDir);
    const dirResult = resDir.getResult();
    assert.strictEqual(dirResult.statusCode, 201, `Direct payment creation must succeed: ${JSON.stringify(dirResult.data)}`);
    const directAdvanceDoc = dirResult.data.data.advance;
    createdAdvanceIds.push(directAdvanceDoc._id);
    const dirVch = await Voucher.findOne({ voucherNumber: dirResult.data.data.voucher.voucherNumber });
    createdVoucherIds.push(dirVch._id);

    // Force vendor payment dates to Year 2029 using raw collection
    await mainDb.collection("vouchers").updateOne({ _id: dirVch._id }, { $set: { date: new Date(`${testYear}-07-15T14:00:00.000Z`), createdAt: new Date(`${testYear}-07-15T14:00:00.000Z`) } });
    await mainDb.collection("cashadvances").updateOne({ _id: directAdvanceDoc._id }, { $set: { createdAt: new Date(`${testYear}-07-15T14:00:00.000Z`), updatedAt: new Date(`${testYear}-07-15T14:00:00.000Z`) } });

    console.log("✅ Dataset created successfully.\n");
    console.log("=======================================================================================");
    console.log("                          VERIFYING REPORT RECONCILIATIONS                             ");
    console.log("=======================================================================================\n");

    // --- REPORT 1: CASH BOOK ---
    console.log("📊 Testing Report 1: Cash Book...");
    const { req: reqCb, res: resCb } = mockReqRes({}, { year: testYear });
    await financeReportsController.getCashBook(reqCb, resCb);
    const cbResult = resCb.getResult();
    assert.strictEqual(cbResult.statusCode, 200, "Cash Book API must return 200");
    const cbData = cbResult.data.data;

    recordResult("1. Cash Book", "Total Inflow (₹)", 1550, cbData.summary.totalIncome);
    recordResult("1. Cash Book", "Total Outflow (₹)", 700, cbData.summary.totalExpense);
    recordResult("1. Cash Book", "Net Balance (₹)", 850, cbData.summary.netBalance);
    recordResult("1. Cash Book", "Entries Count", 5, cbData.summary.count);

    // Verify cumulative running balance
    console.log("   Checking running balance correctness across entries...");
    const cbEntriesAsc = [...cbData.entries].reverse(); // entries are newest first in JSON
    let calcBal = 0;
    let runningBalValid = true;
    for (const e of cbEntriesAsc) {
      calcBal += e.amountIn - e.amountOut;
      if (e.runningBalance !== calcBal) {
        runningBalValid = false;
        console.error(`   ❌ Running balance mismatch at entry ${e.reference}: Expected ${calcBal}, got ${e.runningBalance}`);
      }
    }
    recordResult("1. Cash Book", "Running Balance Cumulative Accuracy", true, runningBalValid);

    // Verify CSV export for Cash Book
    const { req: reqCbCsv, res: resCbCsv } = mockReqRes({}, { year: testYear, export: "csv" });
    await financeReportsController.getCashBook(reqCbCsv, resCbCsv);
    const cbCsv = resCbCsv.getResult().data;
    const cbCsvLines = cbCsv.trim().split("\n");
    recordResult("1. Cash Book", "CSV Rows Equal JSON Entries (1 header + 5 rows)", 6, cbCsvLines.length);

    // --- REPORT 2: DASHBOARD STATS ---
    console.log("\n📊 Testing Report 2: Dashboard Stats...");
    const { req: reqDash, res: resDash } = mockReqRes({}, { date: testDate.toISOString() });
    await financeReportsController.getDashboardStats(reqDash, resDash);
    const dashData = resDash.getResult().data.data;

    recordResult("2. Dashboard Stats", "Today Donations Count", 2, dashData.todayDonationsCount);
    recordResult("2. Dashboard Stats", "Today Donations Total (₹)", 1500, dashData.todayDonationsTotal);
    recordResult("2. Dashboard Stats", "Month Donations Count", 2, dashData.monthDonationsCount);
    recordResult("2. Dashboard Stats", "Month Donations Total (₹)", 1500, dashData.monthDonationsTotal);
    recordResult("2. Dashboard Stats", "Month Vouchers Count", 2, dashData.monthVouchersCount);
    recordResult("2. Dashboard Stats", "Month Vouchers Total (₹)", 650, dashData.monthVouchersTotal);
    recordResult("2. Dashboard Stats", "Net Month Balance (₹)", 850, dashData.netMonthBalance);
    recordResult("2. Dashboard Stats", "Open Advances Count Delta", baseOpenAdvancesCount, dashData.openAdvancesCount);
    recordResult("2. Dashboard Stats", "Open Advances Total Delta (₹)", baseOpenAdvancesTotal, dashData.openAdvancesTotal);

    // --- REPORT 3: VOUCHER REGISTER ---
    console.log("\n📊 Testing Report 3: Voucher Register...");
    const { req: reqVch, res: resVch } = mockReqRes({}, { year: testYear });
    await financeReportsController.getVoucherRegister(reqVch, resVch);
    const vchData = resVch.getResult().data.data;

    recordResult("3. Voucher Register", "Total Vouchers Count", 2, vchData.summary.count);
    recordResult("3. Voucher Register", "Total Vouchers Amount (₹)", 650, vchData.summary.totalAmount);

    const { req: reqVchCsv, res: resVchCsv } = mockReqRes({}, { year: testYear, export: "csv" });
    await financeReportsController.getVoucherRegister(reqVchCsv, resVchCsv);
    const vchCsvLines = resVchCsv.getResult().data.trim().split("\n");
    recordResult("3. Voucher Register", "CSV Rows Equal JSON Entries (1 header + 2 rows)", 3, vchCsvLines.length);

    // --- REPORT 4: OUTSTANDING ADVANCES ---
    console.log("\n📊 Testing Report 4: Outstanding Advances...");
    const { req: reqOut, res: resOut } = mockReqRes({}, {});
    await financeReportsController.getOutstandingAdvances(reqOut, resOut);
    const outData = resOut.getResult().data.data;

    // Verify that neither of our 2 test advances (which were settled) appear in outstanding
    const testAdvInOpen = outData.advances.some(a => createdAdvanceIds.some(id => id.equals(a._id)));
    recordResult("4. Outstanding Advances", "Settled Advances Excluded From Outstanding", false, testAdvInOpen);

    // --- REPORT 5: MONTHLY SUMMARY ---
    console.log("\n📊 Testing Report 5: Monthly Summary...");
    const { req: reqMon, res: resMon } = mockReqRes({}, { year: testYear });
    await financeReportsController.getMonthlySummary(reqMon, resMon);
    const monData = resMon.getResult().data.data;

    const julySummary = monData.monthly[6]; // index 6 is July
    recordResult("5. Monthly Summary", "July Income (₹)", 1500, julySummary.income);
    recordResult("5. Monthly Summary", "July Expense (₹)", 650, julySummary.expense);
    recordResult("5. Monthly Summary", "July Net Balance (₹)", 850, julySummary.net);
    recordResult("5. Monthly Summary", "Annual Total Income (₹)", 1500, monData.summary.totalYearIncome);
    recordResult("5. Monthly Summary", "Annual Total Expense (₹)", 650, monData.summary.totalYearExpense);
    recordResult("5. Monthly Summary", "Annual Net Balance (₹)", 850, monData.summary.netYearBalance);

    const { req: reqMonCsv, res: resMonCsv } = mockReqRes({}, { year: testYear, export: "csv" });
    await financeReportsController.getMonthlySummary(reqMonCsv, resMonCsv);
    const monCsvLines = resMonCsv.getResult().data.trim().split("\n");
    recordResult("5. Monthly Summary", "CSV Rows Equal 12 Months (1 header + 12 rows)", 13, monCsvLines.length);

    // --- REPORT 6: ANNUAL EXPORT CSV (CA AUDIT EXPORT) ---
    console.log("\n📊 Testing Report 6: Annual CA Audit Export...");
    const { req: reqCa, res: resCa } = mockReqRes({}, { year: testYear });
    await financeReportsController.getAnnualExport(reqCa, resCa);
    const caData = resCa.getResult().data.data;

    recordResult("6. Annual CA Export", "Total Audit Transactions Count", 6, caData.count);

    // Verify no duplicates in audit export
    const uniqueRefs = new Set(caData.transactions.map(t => `${t.type}_${t.ref}`));
    recordResult("6. Annual CA Export", "No Duplicate Transactions", caData.count, uniqueRefs.size);

    const { req: reqCaCsv, res: resCaCsv } = mockReqRes({}, { year: testYear, export: "csv" });
    await financeReportsController.getAnnualExport(reqCaCsv, resCaCsv);
    const caCsvLines = resCaCsv.getResult().data.trim().split("\n");
    recordResult("6. Annual CA Export", "CSV Rows Equal JSON Transactions (1 header + 6 rows)", 7, caCsvLines.length);

    // --- VERIFY DATE RANGE FILTERING ---
    console.log("\n📊 Testing Date Range Filtering...");
    const { req: reqDate, res: resDate } = mockReqRes({}, { startDate: `${testYear}-07-01`, endDate: `${testYear}-07-31` });
    await financeReportsController.getCashBook(reqDate, resDate);
    const dateCbData = resDate.getResult().data.data;
    recordResult("Date Filtering", "July Date Range Captures All 5 Cash Book Entries", 5, dateCbData.summary.count);

    const { req: reqOutDate, res: resOutDate } = mockReqRes({}, { startDate: `${testYear}-08-01`, endDate: `${testYear}-08-31` });
    await financeReportsController.getCashBook(reqOutDate, resOutDate);
    const outDateCbData = resOutDate.getResult().data.data;
    recordResult("Date Filtering", "August Date Range Returns 0 Entries", 0, outDateCbData.summary.count);

  } finally {
    if (createdDonationIds.length > 0 || createdAdvanceIds.length > 0 || createdVoucherIds.length > 0) {
      console.log("\n🧹 Cleaning up test reconciliation documents from MongoDB...");
      await mainDb.collection("donations").deleteMany({ _id: { $in: createdDonationIds } });
      await mainDb.collection("cashadvances").deleteMany({ _id: { $in: createdAdvanceIds } });
      await mainDb.collection("vouchers").deleteMany({ _id: { $in: createdVoucherIds } });
      await mainDb.collection("auditlogs").deleteMany({
        $or: [
          { entity: "Donation", entityId: { $in: createdDonationIds } },
          { entity: "CashAdvance", entityId: { $in: createdAdvanceIds } },
          { entity: "Voucher", entityId: { $in: createdVoucherIds } },
        ],
      });
      console.log("✨ Cleanup complete.");
    }

    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed.\n");
  }

  console.log("=======================================================================================");
  console.log(`                 RECONCILIATION SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================================================\n");

  if (failedCount > 0) {
    console.error("❌ RECONCILIATION SUITE FAILED!");
    process.exit(1);
  } else {
    console.log("🎉 ALL RECONCILIATION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runReconciliationSuite();
