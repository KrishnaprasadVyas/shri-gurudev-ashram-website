const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const assert = require("assert");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { mainDb } = connectDB;
const CashAdvance = require("../src/models/CashAdvance");
const Voucher = require("../src/models/Voucher");
const AuditLog = require("../src/models/AuditLog");
const User = require("../src/models/User");
const controller = require("../src/controllers/cashAdvance.controller");

function mockReqRes(body, params = {}, user = { id: new mongoose.Types.ObjectId() }) {
  const req = {
    body,
    params,
    user,
    ip: "127.0.0.1",
    headers: { "user-agent": "RegressionTestSuite/1.0" },
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
    getResult() {
      return { statusCode, data: responseData };
    },
  };

  return { req, res };
}

async function runRegressionSuite() {
  console.log("=======================================================================================");
  console.log("                   ASHRAM ERP — FINANCE REGRESSION TEST SUITE                          ");
  console.log("=======================================================================================\n");

  console.log("⏳ Connecting to MongoDB...");
  await connectDB();
  console.log("✅ MongoDB connected successfully.\n");

  let testUser = await User.findOne({});
  if (!testUser) {
    testUser = { _id: new mongoose.Types.ObjectId(), name: "Regression Trustee" };
  }
  const userId = testUser._id;

  let passedCount = 0;
  let failedCount = 0;
  const createdAdvanceIds = [];
  const createdVoucherIds = [];

  // Helper to run individual test scenario with clean error trapping
  async function runScenario(name, fn) {
    process.stdout.write(`▶ Executing ${name}... `);
    try {
      await fn();
      console.log("✅ PASSED");
      passedCount++;
    } catch (err) {
      console.log("❌ FAILED");
      console.error(`   └─ Assertion Error: ${err.message}`);
      if (err.stack) {
        console.error(`   └─ Stack: ${err.stack.split("\n")[1].trim()}`);
      }
      failedCount++;
    }
  }

  try {
    // =========================================================================
    // SCENARIO 1: Advance ₹10,000 | Expense ₹8,000 | Return ₹2,000
    // =========================================================================
    await runScenario("Scenario 1: Normal Advance Settlement (Partial Return)", async () => {
      // Step 1: Create Advance
      const { req: r1, res: s1 } = mockReqRes(
        {
          givenToName: "RegTest Sevadar 1",
          purpose: "Groceries Purchase",
          category: "GROCERIES_PROVISIONS",
          advanceAmount: 10000,
          notes: "Regression Scenario 1",
        },
        {},
        { id: userId }
      );
      await controller.createAdvance(r1, s1);
      const resCreate = s1.getResult();

      assert.strictEqual(resCreate.statusCode, 201, `Expected 201 on create advance, got ${resCreate.statusCode}`);
      const adv = resCreate.data.data;
      assert.strictEqual(adv.status, "OPEN", "Advance status should be OPEN");
      assert.strictEqual(adv.advanceAmount, 10000, "Advance amount should be 10000");
      createdAdvanceIds.push(adv._id);

      // Step 2: Settle Advance
      const { req: r2, res: s2 } = mockReqRes(
        {
          actualExpense: 8000,
          returnedAmount: 2000,
          paymentMode: "CASH",
          notes: "Returned balance in cash",
        },
        { id: adv._id.toString() },
        { id: userId }
      );
      await controller.settleAdvance(r2, s2);
      const resSettle = s2.getResult();

      assert.strictEqual(resSettle.statusCode, 200, `Expected 200 on settle, got ${resSettle.statusCode}`);

      // Step 3: Assert DB state
      const dbAdv = await CashAdvance.findById(adv._id);
      assert.strictEqual(dbAdv.status, "SETTLED", "DB Advance status should be SETTLED");
      assert.strictEqual(dbAdv.settlement.actualExpense, 8000, "Actual expense should be 8000");
      assert.strictEqual(dbAdv.settlement.returnedAmount, 2000, "Returned amount should be 2000");
      assert.strictEqual(dbAdv.settlement.variance, 0, "Variance should be computed as 0");

      const dbVch = await Voucher.findOne({ sourceId: adv._id });
      assert.ok(dbVch, "Linked Voucher document must exist in DB");
      assert.strictEqual(dbVch.actualAmount, 8000, "Voucher actualAmount should be 8000");
      assert.strictEqual(dbVch.voucherNumber, dbAdv.voucherNumber, "Voucher numbers must match");
      createdVoucherIds.push(dbVch._id);

      const dbAudit = await AuditLog.findOne({ entity: "CashAdvance", entityId: adv._id, action: "ADVANCE_SETTLED" });
      assert.ok(dbAudit, "ADVANCE_SETTLED audit log must exist");
    });

    // =========================================================================
    // SCENARIO 2: Advance ₹10,000 | Expense ₹10,000 | Return ₹0
    // =========================================================================
    await runScenario("Scenario 2: Exact Advance Settlement (Zero Return)", async () => {
      const { req: r1, res: s1 } = mockReqRes(
        {
          givenToName: "RegTest Sevadar 2",
          purpose: "Electricity Bill",
          category: "ELECTRICITY_UTILITIES",
          advanceAmount: 10000,
        },
        {},
        { id: userId }
      );
      await controller.createAdvance(r1, s1);
      const adv = s1.getResult().data.data;
      createdAdvanceIds.push(adv._id);

      const { req: r2, res: s2 } = mockReqRes(
        {
          actualExpense: 10000,
          returnedAmount: 0,
          paymentMode: "CASH",
        },
        { id: adv._id.toString() },
        { id: userId }
      );
      await controller.settleAdvance(r2, s2);
      const resSettle = s2.getResult();

      assert.strictEqual(resSettle.statusCode, 200, "Expected 200 on exact settlement");

      const dbAdv = await CashAdvance.findById(adv._id);
      assert.strictEqual(dbAdv.status, "SETTLED", "Status should be SETTLED");
      assert.strictEqual(dbAdv.settlement.variance, 0, "Variance should be 0");

      const dbVch = await Voucher.findOne({ sourceId: adv._id });
      assert.ok(dbVch, "Voucher must be generated");
      assert.strictEqual(dbVch.actualAmount, 10000, "Voucher actual amount should be 10000");
      createdVoucherIds.push(dbVch._id);
    });

    // =========================================================================
    // SCENARIO 3: Advance ₹10,000 | Expense ₹11,000 | Return ₹0
    // =========================================================================
    await runScenario("Scenario 3: Advance Exceeded by Expense (Variance Rule B.7)", async () => {
      const { req: r1, res: s1 } = mockReqRes(
        {
          givenToName: "RegTest Sevadar 3",
          purpose: "Plumbing Repairs",
          category: "MAINTENANCE_REPAIRS",
          advanceAmount: 10000,
        },
        {},
        { id: userId }
      );
      await controller.createAdvance(r1, s1);
      const adv = s1.getResult().data.data;
      createdAdvanceIds.push(adv._id);

      // Step 3A: Attempt settle WITHOUT notes (Must be rejected & rolled back)
      const { req: r2a, res: s2a } = mockReqRes(
        { actualExpense: 11000, returnedAmount: 0 },
        { id: adv._id.toString() },
        { id: userId }
      );
      await controller.settleAdvance(r2a, s2a);
      const resFail = s2a.getResult();

      assert.strictEqual(resFail.statusCode, 400, "Must return HTTP 400 when variance exists without explanatory note");
      assert.ok(resFail.data.message.includes("variance"), "Error message should mention variance");

      // Verify DB Rollback / Unchanged State after failed attempt
      const dbAdvFail = await CashAdvance.findById(adv._id);
      assert.strictEqual(dbAdvFail.status, "OPEN", "Advance must remain OPEN after rejected settlement");
      assert.ok(!dbAdvFail.voucherId, "No voucher ID should be linked on failed settlement");

      const dbVchFail = await Voucher.findOne({ sourceId: adv._id });
      assert.strictEqual(dbVchFail, null, "No voucher document should be created in DB when settlement fails");

      const dbAuditFail = await AuditLog.findOne({ entity: "CashAdvance", entityId: adv._id, action: "ADVANCE_SETTLED" });
      assert.strictEqual(dbAuditFail, null, "No ADVANCE_SETTLED audit log should exist after rollback");

      // Step 3B: Attempt settle WITH explanatory notes (Must succeed)
      const { req: r2b, res: s2b } = mockReqRes(
        {
          actualExpense: 11000,
          returnedAmount: 0,
          notes: "Sevadar spent ₹1,000 out of pocket for hardware; approved by Trustee.",
        },
        { id: adv._id.toString() },
        { id: userId }
      );
      await controller.settleAdvance(r2b, s2b);
      const resSuccess = s2b.getResult();

      assert.strictEqual(resSuccess.statusCode, 200, "Must succeed when explanatory note is provided");

      const dbAdvSuccess = await CashAdvance.findById(adv._id);
      assert.strictEqual(dbAdvSuccess.status, "SETTLED", "Advance must be SETTLED");
      assert.strictEqual(dbAdvSuccess.settlement.variance, -1000, "Variance must be recorded as -1000");
      assert.ok(dbAdvSuccess.settlement.notes.includes("out of pocket"), "Notes must be saved");

      const dbVchSuccess = await Voucher.findOne({ sourceId: adv._id });
      assert.ok(dbVchSuccess, "Voucher must be created");
      assert.strictEqual(dbVchSuccess.actualAmount, 11000, "Voucher amount must be 11000");
      createdVoucherIds.push(dbVchSuccess._id);
    });

    // =========================================================================
    // SCENARIO 4: Advance ₹10,000 | Return ₹11,000 (Invalid Return > Advance)
    // =========================================================================
    await runScenario("Scenario 4: Returned Amount Exceeds Advance (Rollback Verification)", async () => {
      const { req: r1, res: s1 } = mockReqRes(
        {
          givenToName: "RegTest Sevadar 4",
          purpose: "Transport Advance",
          category: "TRANSPORT",
          advanceAmount: 10000,
        },
        {},
        { id: userId }
      );
      await controller.createAdvance(r1, s1);
      const adv = s1.getResult().data.data;
      createdAdvanceIds.push(adv._id);

      // Attempt invalid settlement where returned > advance
      const { req: r2, res: s2 } = mockReqRes(
        { actualExpense: 0, returnedAmount: 11000 },
        { id: adv._id.toString() },
        { id: userId }
      );
      await controller.settleAdvance(r2, s2);
      const resSettle = s2.getResult();

      assert.strictEqual(resSettle.statusCode, 400, "Must reject return amount > advance amount with HTTP 400");
      assert.ok(resSettle.data.message.includes("cannot exceed"), "Error message should clearly state violation");

      // Verify complete DB rollback and cleanliness
      const dbAdv = await CashAdvance.findById(adv._id);
      assert.strictEqual(dbAdv.status, "OPEN", "Advance must remain in OPEN status");
      assert.ok(!dbAdv.voucherId, "No voucher linked");

      const dbVch = await Voucher.findOne({ sourceId: adv._id });
      assert.strictEqual(dbVch, null, "Zero vouchers created in DB");

      const dbAudit = await AuditLog.findOne({ entity: "CashAdvance", entityId: adv._id, action: "ADVANCE_SETTLED" });
      assert.strictEqual(dbAudit, null, "Zero settlement audit logs created");
    });

    // =========================================================================
    // SCENARIO 5: Direct Vendor Payment (Type B Atomic Purchase)
    // =========================================================================
    await runScenario("Scenario 5: Direct Vendor Payment (Atomic Type B Purchase)", async () => {
      const { req: r1, res: s1 } = mockReqRes(
        {
          givenToName: "RegTest Hardware Store",
          purpose: "Cement Bags for Bhandara Hall",
          category: "CONSTRUCTION",
          actualAmount: 25000,
          paymentMode: "NEFT",
          paymentRef: "NEFT-REG-9988",
          bankName: "SBI",
          notes: "Direct invoice payment",
        },
        {},
        { id: userId }
      );
      await controller.createDirectPayment(r1, s1);
      const resDirect = s1.getResult();

      assert.strictEqual(resDirect.statusCode, 201, `Expected 201 on direct payment, got ${resDirect.statusCode}`);
      const { advance: advDoc, voucher: vchDoc } = resDirect.data.data;

      assert.ok(advDoc && vchDoc, "Both Advance and Voucher documents must be returned");
      createdAdvanceIds.push(advDoc._id);
      createdVoucherIds.push(vchDoc._id);

      const dbAdv = await CashAdvance.findById(advDoc._id);
      assert.strictEqual(dbAdv.type, "DIRECT_PAYMENT", "Type must be DIRECT_PAYMENT");
      assert.strictEqual(dbAdv.status, "SETTLED", "Direct payment must be automatically SETTLED");
      assert.strictEqual(dbAdv.advanceAmount, 25000, "Amount must be 25000");

      const dbVch = await Voucher.findById(vchDoc._id);
      assert.strictEqual(dbVch.sourceType, "DIRECT_PAYMENT", "Voucher sourceType must be DIRECT_PAYMENT");
      assert.strictEqual(dbVch.actualAmount, 25000, "Voucher actualAmount must match");
      assert.strictEqual(dbVch.bankName, "SBI", "Bank details must be preserved");

      const dbAudit = await AuditLog.findOne({ entity: "Voucher", entityId: vchDoc._id, action: "DIRECT_PAYMENT_RECORDED" });
      assert.ok(dbAudit, "DIRECT_PAYMENT_RECORDED audit log must exist");
    });

    // =========================================================================
    // SCENARIO 6: Attempt to Edit/Delete Voucher After Creation
    // =========================================================================
    await runScenario("Scenario 6: Voucher Immutability Enforcement (Edit & Delete Interception)", async () => {
      assert.ok(createdVoucherIds.length > 0, "Need at least one created voucher from previous scenarios to test immutability");
      const testVchId = createdVoucherIds[0];
      const dbVch = await Voucher.findById(testVchId);
      const originalAmount = dbVch.actualAmount;

      // Test 6A: .save() edit attempt
      let saveError = null;
      try {
        dbVch.actualAmount = 999999;
        await dbVch.save();
      } catch (err) {
        saveError = err;
      }
      assert.ok(saveError && saveError.message.includes("immutable"), "Must reject .save() modifications with immutable error");

      // Test 6B: findOneAndUpdate edit attempt
      let findUpdateError = null;
      try {
        await Voucher.findOneAndUpdate({ _id: testVchId }, { actualAmount: 888888 });
      } catch (err) {
        findUpdateError = err;
      }
      assert.ok(findUpdateError && findUpdateError.message.includes("immutable"), "Must reject findOneAndUpdate modifications");

      // Test 6C: updateOne edit attempt
      let updateOneError = null;
      try {
        await Voucher.updateOne({ _id: testVchId }, { actualAmount: 777777 });
      } catch (err) {
        updateOneError = err;
      }
      assert.ok(updateOneError && updateOneError.message.includes("immutable"), "Must reject updateOne modifications");

      // Test 6D: deleteOne delete attempt
      let deleteError = null;
      try {
        await Voucher.deleteOne({ _id: testVchId });
      } catch (err) {
        deleteError = err;
      }
      assert.ok(deleteError && deleteError.message.includes("cannot be deleted"), "Must reject deleteOne deletion attempts");

      // Verify DB record is 100% untouched
      const verifyVch = await Voucher.findById(testVchId);
      assert.strictEqual(verifyVch.actualAmount, originalAmount, "Voucher actualAmount in DB must remain exactly as originally created");
    });

  } finally {
    // Optional clean up of test records created during this regression run to maintain clean database
    if (createdAdvanceIds.length > 0 || createdVoucherIds.length > 0) {
      console.log("\n🧹 Cleaning up test regression documents...");
      // Bypass Mongoose pre-remove hooks for cleanup by using raw collection deleteMany
      await mainDb.collection("cashadvances").deleteMany({ _id: { $in: createdAdvanceIds } });
      await mainDb.collection("vouchers").deleteMany({ _id: { $in: createdVoucherIds } });
      await mainDb.collection("auditlogs").deleteMany({
        $or: [
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
  console.log(`                       REGRESSION SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================================================\n");

  if (failedCount > 0) {
    console.error("❌ REGRESSION SUITE FAILED!");
    process.exit(1);
  } else {
    console.log("🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!");
    process.exit(0);
  }
}

runRegressionSuite();
