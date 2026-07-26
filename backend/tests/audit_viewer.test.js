/**
 * Ashram ERP — Phase 6 Statutory Audit Trail Verification Suite
 * Verifies read-only ledger access, multi-field filtering, pagination, and immutability enforcement.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const connectDB = require("../src/config/db");
const { mainDb } = connectDB;
const User = require("../src/models/User");
const AuditLog = require("../src/models/AuditLog");
const financeRoutes = require("../src/routes/finance.routes");

let app, server, baseUrl, testAdmin, authToken;
let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[✅ PASS] ${message}`);
  } else {
    console.error(`[❌ FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function makeRequest(method, endpoint, token = authToken) {
  const url = new URL(endpoint, baseUrl);
  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
          } catch (e) {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================================================");
  console.log("                   ASHRAM ERP — PHASE 6 AUDIT TRAIL SUITE                              ");
  console.log("=======================================================================================\n");

  await connectDB();
  console.log("✅ MongoDB connected successfully.");

  app = express();
  app.use(express.json());
  app.use("/api/finance", financeRoutes);

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  // Setup test trustee
  await User.deleteMany({ mobile: "9999999990" });
  testAdmin = await User.create({
    name: "Statutory Trustee",
    mobile: "9999999990",
    role: "TRUSTEE",
  });
  authToken = jwt.sign(
    { userId: testAdmin._id.toString(), role: "TRUSTEE" },
    process.env.JWT_SECRET || "fallback_secret",
    { expiresIn: "1h" }
  );

  // Clean up and seed deterministic audit logs directly bypassing hooks via collection
  const auditCol = mainDb.collection("auditlogs");
  await auditCol.deleteMany({ performedBy: testAdmin._id });

  console.log("\n🏗️  Seeding 35 deterministic statutory audit records for pagination & filter testing...");
  const sampleLogs = [];
  const baseDate = new Date("2029-07-01T10:00:00.000Z");

  for (let i = 1; i <= 35; i++) {
    let action = "ADVANCE_CREATED";
    let entity = "CashAdvance";
    let ref = `ADV-0000${i.toString().padStart(2, "0")}`;
    let amount = 5000 + i * 100;

    if (i % 3 === 0) {
      action = "ADVANCE_SETTLED";
      amount = 4500;
    } else if (i % 5 === 0) {
      action = "VOUCHER_CREATED";
      entity = "Voucher";
      ref = `VCH-0000${i.toString().padStart(2, "0")}`;
    } else if (i % 7 === 0) {
      action = "DONATION_CREATED";
      entity = "Donation";
      ref = `CA-0000${i.toString().padStart(2, "0")}`;
    }

    sampleLogs.push({
      action,
      entity,
      entityId: new mongoose.Types.ObjectId(),
      entityRef: ref,
      performedBy: testAdmin._id,
      performedByName: "Statutory Trustee",
      performedByRole: "TRUSTEE",
      financialDetails: {
        amount,
        paymentMode: "CASH",
        referenceNumber: `REF-${i}`,
      },
      details: { itemIndex: i, testPurpose: "Phase 6 verification" },
      createdAt: new Date(baseDate.getTime() + i * 3600000), // Hourly increments
    });
  }

  await auditCol.insertMany(sampleLogs);
  console.log("✅ Seeding completed.");

  console.log("\n📊 Verifying Filter Options Endpoint (/api/finance/audit-logs/filters)...");
  const filterRes = await makeRequest("GET", "/api/finance/audit-logs/filters");
  assert(filterRes.status === 200, "Filter options returns HTTP 200");
  assert(Array.isArray(filterRes.data.data.actions), "Actions list is an array");
  assert(Array.isArray(filterRes.data.data.entities), "Entities list is an array");
  assert(filterRes.data.data.actions.includes("ADVANCE_SETTLED"), "Actions list includes ADVANCE_SETTLED");
  assert(filterRes.data.data.entities.includes("CashAdvance"), "Entities list includes CashAdvance");

  console.log("\n📊 Verifying Pagination & Default Sorting (/api/finance/audit-logs)...");
  const page1Res = await makeRequest("GET", "/api/finance/audit-logs?page=1&limit=10");
  assert(page1Res.status === 200, "Paginated query returns HTTP 200");
  assert(page1Res.data.data.logs.length === 10, "Page 1 returns exactly 10 records");
  assert(page1Res.data.data.pagination.total >= 35, "Total count reflects seeded records");
  assert(page1Res.data.data.pagination.pages >= 4, "Total pages correctly calculated");

  // Verify sort order (newest first)
  const log0Date = new Date(page1Res.data.data.logs[0].createdAt).getTime();
  const log1Date = new Date(page1Res.data.data.logs[1].createdAt).getTime();
  assert(log0Date >= log1Date, "Records are sorted strictly newest first (createdAt descending)");

  console.log("\n📊 Verifying Entity Filtering...");
  const voucherRes = await makeRequest("GET", "/api/finance/audit-logs?entity=Voucher&limit=50");
  assert(voucherRes.status === 200, "Entity filter returns HTTP 200");
  const allVouchers = voucherRes.data.data.logs.every((l) => l.entity === "Voucher");
  assert(allVouchers && voucherRes.data.data.logs.length > 0, "Only Voucher entity logs returned");

  console.log("\n📊 Verifying Action Filtering...");
  const settledRes = await makeRequest("GET", "/api/finance/audit-logs?action=ADVANCE_SETTLED&limit=50");
  assert(settledRes.status === 200, "Action filter returns HTTP 200");
  const allSettled = settledRes.data.data.logs.every((l) => l.action === "ADVANCE_SETTLED");
  assert(allSettled && settledRes.data.data.logs.length > 0, "Only ADVANCE_SETTLED action logs returned");

  console.log("\n📊 Verifying Search Query (matching entityRef)...");
  const searchRes = await makeRequest("GET", "/api/finance/audit-logs?search=ADV-000002");
  assert(searchRes.status === 200, "Search query returns HTTP 200");
  assert(searchRes.data.data.logs.length >= 1 && searchRes.data.data.logs[0].entityRef === "ADV-000002", "Search accurately matches exact reference number");

  console.log("\n📊 Verifying Immutability Enforcement at Database Layer...");
  let saveThrow = false;
  try {
    const existingLog = await AuditLog.findOne({ entityRef: "ADV-000002" });
    if (existingLog) {
      existingLog.notes = "Attempted unauthorized mutation";
      await existingLog.save();
    }
  } catch (err) {
    saveThrow = true;
  }
  assert(saveThrow, "AuditLog save() hook intercepts and blocks mutation attempts on existing records");

  let updateThrow = false;
  try {
    await AuditLog.updateOne({ entityRef: "ADV-000002" }, { $set: { notes: "Hacked" } });
  } catch (err) {
    updateThrow = true;
  }
  assert(updateThrow, "AuditLog updateOne() query middleware blocks direct query mutations");

  let deleteThrow = false;
  try {
    await AuditLog.deleteOne({ entityRef: "ADV-000002" });
  } catch (err) {
    deleteThrow = true;
  }
  assert(deleteThrow, "AuditLog deleteOne() query middleware blocks deletion attempts");

  console.log("\n🧹 Cleaning up test audit records...");
  await auditCol.deleteMany({ performedBy: testAdmin._id });
  await User.deleteMany({ mobile: "9999999990" });

  await new Promise((resolve) => server.close(resolve));
  await mainDb.close();
  await connectDB.sharedDb.close();
  await mongoose.disconnect();

  console.log("\n=======================================================================================");
  console.log(`🎉 PHASE 6 AUDIT SUITE SUMMARY: ${passedChecks}/${totalChecks} PASSED, 0 FAILED`);
  console.log("=======================================================================================\n");
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
