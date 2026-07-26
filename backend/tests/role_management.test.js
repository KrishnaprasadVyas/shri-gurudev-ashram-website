/**
 * Ashram ERP — Phase 7 Role Management Verification Suite
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
const systemRoutes = require("../src/routes/admin.system.routes");

let app, server, baseUrl, sysAdmin, trustee, normalUser, sysAdminToken, trusteeToken;
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

async function makeRequest(method, endpoint, token, body = { newRole: "TRUSTEE" }) {
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
    if (method === "PATCH") req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log("\n=======================================================================================");
  console.log("                   ASHRAM ERP — PHASE 7 ROLE MANAGEMENT SUITE                              ");
  console.log("=======================================================================================\n");

  await connectDB();
  app = express();
  app.use(express.json());
  app.use("/api/admin/system", systemRoutes);

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });

  // Setup test users
  await User.deleteMany({ mobile: { $in: ["9999999991", "9999999992", "9999999993"] } });
  
  sysAdmin = await User.create({ name: "Sys Admin", mobile: "9999999991", role: "SYSTEM_ADMIN" });
  trustee = await User.create({ name: "Trustee", mobile: "9999999992", role: "TRUSTEE" });
  normalUser = await User.create({ name: "Normal User", mobile: "9999999993", role: "USER" });

  sysAdminToken = jwt.sign({ userId: sysAdmin._id.toString(), role: "SYSTEM_ADMIN" }, process.env.JWT_SECRET || "fallback", { expiresIn: "1h" });
  trusteeToken = jwt.sign({ userId: trustee._id.toString(), role: "TRUSTEE" }, process.env.JWT_SECRET || "fallback", { expiresIn: "1h" });

  console.log("\n📊 Verifying GET /api/admin/system/users...");
  const getSysRes = await makeRequest("GET", "/api/admin/system/users", sysAdminToken);
  assert(getSysRes.status === 200, "SYSTEM_ADMIN can view all users");
  assert(getSysRes.data.data.users.length >= 3, "User list returned correctly");

  const getTrusRes = await makeRequest("GET", "/api/admin/system/users", trusteeToken);
  assert(getTrusRes.status === 403, "TRUSTEE cannot view all users (HTTP 403)");

  console.log("\n📊 Verifying PATCH /api/admin/system/users/:id/role...");
  const patchTrusRes = await makeRequest("PATCH", `/api/admin/system/users/${normalUser._id}/role`, trusteeToken);
  assert(patchTrusRes.status === 403, "TRUSTEE cannot change roles (HTTP 403)");

  const patchSelfRes = await makeRequest("PATCH", `/api/admin/system/users/${sysAdmin._id}/role`, sysAdminToken);
  assert(patchSelfRes.status === 403, "SYSTEM_ADMIN cannot change their own role");

  const patchSuccessRes = await makeRequest("PATCH", `/api/admin/system/users/${normalUser._id}/role`, sysAdminToken);
  assert(patchSuccessRes.status === 200, "SYSTEM_ADMIN can assign TRUSTEE role to a normal user");

  const patchWebsiteAdminRes = await makeRequest(
    "PATCH", `/api/admin/system/users/${normalUser._id}/role`, sysAdminToken,
    { newRole: "WEBSITE_ADMIN" },
  );
  assert(patchWebsiteAdminRes.status === 200, "SYSTEM_ADMIN can assign a current non-financial schema role");

  const patchLegacyRoleRes = await makeRequest(
    "PATCH", `/api/admin/system/users/${normalUser._id}/role`, sysAdminToken,
    { newRole: "COLLECTOR" },
  );
  assert(patchLegacyRoleRes.status === 400, "Legacy role names rejected by the current User schema are not assignable");

  // Verify Audit Log was created
  const log = await AuditLog.findOne({ action: "ROLE_CHANGED", entityId: normalUser._id }).sort({ createdAt: -1 });
  assert(log !== null, "Role change shows in AuditLog");
  assert(log.performedBy.toString() === sysAdmin._id.toString(), "AuditLog correctly records SYSTEM_ADMIN as performer");

  console.log("\n🧹 Cleaning up...");
  await User.deleteMany({ mobile: { $in: ["9999999991", "9999999992", "9999999993"] } });
  await mainDb.collection("auditlogs").deleteOne({ _id: log?._id });

  await new Promise((resolve) => server.close(resolve));
  await mainDb.close();
  await connectDB.sharedDb.close();
  await mongoose.disconnect();

  console.log("\n=======================================================================================");
  console.log(`🎉 PHASE 7 ROLE MANAGEMENT SUITE SUMMARY: ${passedChecks}/${totalChecks} PASSED, 0 FAILED`);
  console.log("=======================================================================================\n");
  process.exit(0);
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
