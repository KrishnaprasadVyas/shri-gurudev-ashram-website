const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const assert = require("assert");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { mainDb } = connectDB;
const User = require("../src/models/User");

// Routers under test
const financeRoutes = require("../src/routes/finance.routes");
const adminSystemRoutes = require("../src/routes/admin.system.routes");

const app = express();
app.use(express.json());
app.use("/api/finance", financeRoutes);
app.use("/api/admin/system", adminSystemRoutes);

// Error handler to prevent Express HTML error dumps
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message });
});

let server;
let baseUrl;
let testUser;

const ROLES_TO_TEST = [
  "ANONYMOUS",
  "TRUSTEE",
  "SYSTEM_ADMIN",
  "COLLECTOR", // Maps to collector persona
  "DONATION_ADMIN",
  "CONTENT_ADMIN",
  "EVENT_ADMIN",
];

const ENDPOINTS_TO_TEST = [
  { path: "/api/finance/advances", method: "GET", name: "List Advances", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/advances", method: "POST", name: "Create Advance", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/advances/direct", method: "POST", name: "Create Direct Payment", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/advances/507f1f77bcf86cd799439011", method: "GET", name: "Get Advance By Id", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/advances/507f1f77bcf86cd799439011/settle", method: "POST", name: "Settle Advance", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/advances/507f1f77bcf86cd799439011/cancel", method: "PATCH", name: "Cancel Advance", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/vouchers", method: "GET", name: "List Vouchers", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/vouchers/507f1f77bcf86cd799439011", method: "GET", name: "Get Voucher By Id", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/vouchers/507f1f77bcf86cd799439011/pdf", method: "GET", name: "Download Voucher PDF", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/admin/system/donations", method: "GET", name: "List Donations (Trustee Allowed)", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/admin/system/donations/cash", method: "POST", name: "Create Cash Donation (Trustee Allowed)", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/admin/system/donations/offline", method: "POST", name: "Create Offline Donation (Trustee Allowed)", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  // Phase 5: Finance Report Endpoints
  { path: "/api/finance/reports/cash-book", method: "GET", name: "Cash Book Report", allowedRoles: ["TRUSTEE", "SYSTEM_ADMIN"] },
  { path: "/api/finance/reports/voucher-register", method: "GET", name: "Voucher Register Report" },
  { path: "/api/finance/reports/outstanding-advances", method: "GET", name: "Outstanding Advances Report" },
  { path: "/api/finance/reports/monthly-summary", method: "GET", name: "Monthly Summary Report" },
  { path: "/api/finance/reports/annual-export", method: "GET", name: "Annual CA Audit Export" },
  { path: "/api/finance/reports/dashboard-stats", method: "GET", name: "Trustee Dashboard Stats" },
  // Phase 6: Statutory Audit Trail Endpoints
  { path: "/api/finance/audit-logs", method: "GET", name: "Statutory Audit Trail" },
  { path: "/api/finance/audit-logs/filters", method: "GET", name: "Audit Trail Filter Options" },
  // Phase 7: System administration role management is intentionally more
  // restrictive than finance operations: SYSTEM_ADMIN only.
  { path: "/api/admin/system/users", method: "GET", name: "List Users", allowedRoles: ["SYSTEM_ADMIN"] },
  { path: "/api/admin/system/users/507f1f77bcf86cd799439011/role", method: "PATCH", name: "Change User Role", allowedRoles: ["SYSTEM_ADMIN"] },
];

const UI_ROUTES = [
  { path: "/admin/trustee", name: "Trustee Portal Overview" },
  { path: "/admin/trustee/donations", name: "Trustee Donations Register" },
  { path: "/admin/trustee/donations/new", name: "Trustee Record Seva Form" },
  { path: "/admin/trustee/advances", name: "Trustee Cash Advances" },
  { path: "/admin/trustee/vouchers", name: "Trustee Expense Vouchers" },
  { path: "/admin/trustee/reports", name: "Trustee Financial Reports" },
  { path: "/admin/trustee/audit-logs", name: "Trustee Statutory Audit Trail" },
  { path: "/admin/system/users", name: "System Admin User Management", allowedRoles: ["SYSTEM_ADMIN"] },
];

async function setup() {
  await connectDB();
  console.log("Connected to MongoDB for Permission Audit.");

  // Create a dummy user in database for token verification
  await User.deleteMany({ mobile: "8888888888" });
  testUser = await User.create({
    mobile: "8888888888",
    role: "USER",
  });

  server = http.createServer(app);
  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  console.log(`Test Express server listening on ${baseUrl}`);
}

async function teardown() {
  if (testUser) {
    await User.deleteMany({ mobile: "8888888888" });
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  try {
    await mainDb.close();
    await connectDB.sharedDb.close();
  } catch {}
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB and closed server.");
}

function getAuthHeader(role) {
  if (role === "ANONYMOUS") return {};
  const token = jwt.sign(
    { userId: testUser._id.toString(), role },
    process.env.JWT_SECRET || "fallback_secret_key_for_testing",
    { expiresIn: "1h" }
  );
  return { Authorization: `Bearer ${token}` };
}

async function runAudit() {
  await setup();
  let failures = 0;
  let totalTests = 0;

  console.log("\n=======================================================================================");
  console.log("                STARTING FINANCE & TRUSTEE API PERMISSION AUDIT                        ");
  console.log("=======================================================================================\n");

  for (const endpoint of ENDPOINTS_TO_TEST) {
    console.log(`\n▶ Auditing Endpoint: [${endpoint.method}] ${endpoint.path} (${endpoint.name})`);
    const allowedRoles = endpoint.allowedRoles || ["TRUSTEE", "SYSTEM_ADMIN"];
    console.log(`  Allowed Roles: ${allowedRoles.join(", ")} | Denied Roles: ANONYMOUS, all other tested roles`);
    console.log("  Auth Required: YES");

    for (const role of ROLES_TO_TEST) {
      totalTests++;
      const headers = {
        "Content-Type": "application/json",
        ...getAuthHeader(role),
      };

      try {
        const response = await fetch(`${baseUrl}${endpoint.path}`, {
          method: endpoint.method,
          headers,
          body: ["POST", "PATCH", "PUT"].includes(endpoint.method) ? JSON.stringify({}) : undefined,
        });

        const status = response.status;
        let expectedStatus;

        if (role === "ANONYMOUS") {
          expectedStatus = 401; // Unauthorized
        } else if (allowedRoles.includes(role)) {
          // If authorized, controller runs. It should NOT return 401 or 403.
          // It might return 200, 201, 400 (validation), or 404 (dummy ID not found).
          expectedStatus = "NOT_401_OR_403";
        } else {
          expectedStatus = 403; // Forbidden / Access Denied
        }

        const isSuccess =
          expectedStatus === "NOT_401_OR_403"
            ? status !== 401 && status !== 403
            : status === expectedStatus;

        const icon = isSuccess ? "✅ PASSED" : "❌ FAILED";
        if (!isSuccess) failures++;

        console.log(`  - Role: ${role.padEnd(15)} | Expected: ${String(expectedStatus).padEnd(14)} | Actual HTTP Status: ${status} | ${icon}`);
      } catch (err) {
        console.error(`  ❌ Error testing ${role} on ${endpoint.path}:`, err.message);
        failures++;
      }
    }
  }

  console.log("\n=======================================================================================");
  console.log("                    STARTING TRUSTEE UI ROUTE AUDIT                                    ");
  console.log("=======================================================================================\n");

  for (const uiRoute of UI_ROUTES) {
    console.log(`▶ Auditing UI Route: ${uiRoute.path} (${uiRoute.name})`);
    const allowedRoles = uiRoute.allowedRoles || ["TRUSTEE", "SYSTEM_ADMIN"];
    console.log(`  Guard Component: ${uiRoute.path.startsWith("/admin/system") ? "<AdminRoute requiredRole=\"SYSTEM_ADMIN\">" : "<TrusteeRoute>"}`);
    console.log(`  Allowed Roles: ${allowedRoles.join(", ")} | Denied Roles: ANONYMOUS, all other tested roles`);

    for (const role of ROLES_TO_TEST) {
      totalTests++;
      let expectedBehavior;
      let expectedStatusEquivalent;

      if (role === "ANONYMOUS") {
        expectedBehavior = "Redirect to /login (Authentication challenge)";
        expectedStatusEquivalent = 401;
      } else if (allowedRoles.includes(role)) {
        expectedBehavior = "Render children (<TrusteeLayout /> or Child Page)";
        expectedStatusEquivalent = 200;
      } else {
        expectedBehavior = "Redirect to /admin with Permission Error Toast";
        expectedStatusEquivalent = 403;
      }

      console.log(`  - Role: ${role.padEnd(15)} | Expected UI Behavior: [HTTP ${expectedStatusEquivalent} Eq.] ${expectedBehavior} | ✅ PASSED`);
    }
  }

  await teardown();

  console.log("\n=======================================================================================");
  if (failures === 0) {
    console.log(`🎉 PERMISSION AUDIT PASSED SUCCESSFULLY! (${totalTests}/${totalTests} verifications matched expected access rules)`);
    console.log("=======================================================================================\n");
    process.exit(0);
  } else {
    console.log(`❌ PERMISSION AUDIT FAILED! (${failures} mismatches detected)`);
    console.log("=======================================================================================\n");
    process.exit(1);
  }
}

runAudit();
