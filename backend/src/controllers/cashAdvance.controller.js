const mongoose = require("mongoose");
const { mainDb } = require("../config/db");
const CashAdvance = require("../models/CashAdvance");
const Voucher = require("../models/Voucher");
const AuditLog = require("../models/AuditLog");
const { getNextNumber } = require("../services/counter.service");

/**
 * Helper to run an operation inside a transaction if supported, or sequentially if standalone
 */
async function runWithTransaction(fn) {
  let session = null;
  let useTransaction = false;
  try {
    session = await mainDb.startSession();
    session.startTransaction();
    useTransaction = true;
  } catch (err) {
    // Standalone MongoDB does not support multi-document transactions
    if (session) {
      session.endSession();
      session = null;
    }
  }

  try {
    const result = await fn(session);
    if (useTransaction && session) {
      await session.commitTransaction();
    }
    return result;
  } catch (err) {
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (e) {}
    }
    throw err;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}

/**
 * 1. Create Type A Cash Advance
 * POST /api/finance/advances
 */
exports.createAdvance = async (req, res) => {
  try {
    const { givenToName, givenToUserId, purpose, category, advanceAmount, notes } = req.body;

    if (!givenToName || !purpose || !category || !advanceAmount) {
      return res.status(400).json({
        message: "givenToName, purpose, category, and advanceAmount are required.",
      });
    }

    const amount = Number(advanceAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "advanceAmount must be a positive number." });
    }

    const advanceNumber = await getNextNumber("ADV");

    const advance = await CashAdvance.create({
      advanceNumber,
      type: "ADVANCE",
      givenTo: {
        name: givenToName.trim(),
        userId: givenToUserId || null,
      },
      purpose: purpose.trim(),
      category,
      advanceAmount: amount,
      status: "OPEN",
      addedBy: req.user.id,
      notes: notes ? notes.trim() : "",
    });

    // Audit log
    await AuditLog.create({
      action: "ADVANCE_CREATED",
      performedBy: req.user.id,
      targetUser: givenToUserId || null,
      entity: "CashAdvance",
      entityId: advance._id,
      details: {
        advanceNumber,
        advanceAmount: amount,
        category,
        givenToName,
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"] || "",
    });

    return res.status(201).json({
      success: true,
      message: "Cash advance created successfully.",
      data: advance,
    });
  } catch (err) {
    console.error("Error in createAdvance:", err);
    return res.status(500).json({ message: "Server error creating cash advance." });
  }
};

/**
 * 2. Create Type B Direct Vendor Payment (Auto-generates Voucher)
 * POST /api/finance/advances/direct
 */
exports.createDirectPayment = async (req, res) => {
  try {
    const {
      givenToName,
      givenToUserId,
      purpose,
      category,
      actualAmount,
      paymentMode,
      paymentRef,
      paymentDate,
      bankName,
      accountNo,
      notes,
    } = req.body;

    if (!givenToName || !purpose || !category || !actualAmount || !paymentMode) {
      return res.status(400).json({
        message: "givenToName, purpose, category, actualAmount, and paymentMode are required.",
      });
    }

    const amount = Number(actualAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "actualAmount must be a positive number." });
    }

    const result = await runWithTransaction(async (session) => {
      const advanceNumber = await getNextNumber("ADV", session);
      const voucherNumber = await getNextNumber("VCH", session);

      const advanceId = new mongoose.Types.ObjectId();
      const voucherId = new mongoose.Types.ObjectId();

      const voucherDoc = {
        _id: voucherId,
        voucherNumber,
        sourceType: "DIRECT_PAYMENT",
        sourceId: advanceId,
        title: `${purpose.trim()} — ${givenToName.trim()}`,
        category,
        advanceAmount: null,
        actualAmount: amount,
        returnedAmount: null,
        paymentMode: paymentMode || "CASH",
        paymentRef: paymentRef || "",
        bankName: bankName || "",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        items: [
          {
            description: purpose.trim(),
            amount: amount,
            category,
          },
        ],
        personName: givenToName.trim(),
        preparedBy: req.user.id,
        date: paymentDate ? new Date(paymentDate) : new Date(),
      };

      const [voucher] = await Voucher.create([voucherDoc], { session });

      const advanceDoc = {
        _id: advanceId,
        advanceNumber,
        type: "DIRECT_PAYMENT",
        givenTo: {
          name: givenToName.trim(),
          userId: givenToUserId || null,
        },
        purpose: purpose.trim(),
        category,
        advanceAmount: amount,
        directPayment: {
          paymentMode: paymentMode || "CASH",
          paymentRef: paymentRef || "",
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          bankName: bankName || "",
          accountNo: accountNo || "",
        },
        voucherId: voucher._id,
        voucherNumber: voucher.voucherNumber,
        status: "SETTLED",
        addedBy: req.user.id,
        notes: notes ? notes.trim() : "",
      };

      const [advance] = await CashAdvance.create([advanceDoc], { session });

      await AuditLog.create(
        [
          {
            action: "DIRECT_PAYMENT_RECORDED",
            performedBy: req.user.id,
            targetUser: givenToUserId || null,
            entity: "Voucher",
            entityId: voucher._id,
            details: {
              advanceNumber,
              voucherNumber,
              amount,
              category,
              paymentMode,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
            userAgent: req.headers["user-agent"] || "",
          },
        ],
        { session }
      );

      return { advance, voucher };
    });

    return res.status(201).json({
      success: true,
      message: "Direct vendor payment recorded and voucher generated.",
      data: result,
    });
  } catch (err) {
    console.error("Error in createDirectPayment:", err);
    return res.status(500).json({ message: "Server error recording direct payment." });
  }
};

/**
 * 3. Settle Type A Cash Advance (Triggers Auto-Voucher)
 * POST /api/finance/advances/:id/settle
 */
exports.settleAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualExpense, returnedAmount, paymentMode, paymentRef, notes, items } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid advance ID format." });
    }

    const advance = await CashAdvance.findById(id);
    if (!advance) {
      return res.status(404).json({ message: "Cash advance not found." });
    }

    if (advance.type !== "ADVANCE") {
      return res.status(400).json({ message: "Only Type A advances can be settled." });
    }

    if (advance.status === "SETTLED") {
      return res.status(400).json({ message: "This cash advance is already settled." });
    }

    if (advance.status === "CANCELLED") {
      return res.status(400).json({ message: "Cannot settle a cancelled cash advance." });
    }

    const expense = Number(actualExpense || 0);
    const returned = Number(returnedAmount || 0);

    if (isNaN(expense) || expense < 0 || isNaN(returned) || returned < 0) {
      return res.status(400).json({ message: "actualExpense and returnedAmount must be valid positive numbers or zero." });
    }

    if (returned > advance.advanceAmount) {
      return res.status(400).json({ message: "Returned amount cannot exceed the advance amount." });
    }

    const variance = advance.advanceAmount - expense - returned;
    if (Math.abs(variance) > 1 && (!notes || !notes.trim())) {
      return res.status(400).json({
        message: `There is a variance of INR ${variance}. Please provide explanatory notes or adjust amounts.`,
      });
    }

    const parsedItems = Array.isArray(items) ? items : [];
    if (parsedItems.length === 0 && expense > 0) {
      parsedItems.push({
        description: advance.purpose,
        amount: expense,
        category: advance.category,
      });
    }

    const result = await runWithTransaction(async (session) => {
      const voucherNumber = await getNextNumber("VCH", session);

      const voucherDoc = {
        voucherNumber,
        sourceType: "ADVANCE_SETTLEMENT",
        sourceId: advance._id,
        title: `${advance.purpose} — ${advance.givenTo.name}`,
        category: advance.category,
        advanceAmount: advance.advanceAmount,
        actualAmount: expense,
        returnedAmount: returned,
        paymentMode: paymentMode || "CASH",
        paymentRef: paymentRef || "",
        items: parsedItems,
        personName: advance.givenTo.name,
        preparedBy: req.user.id,
        date: new Date(),
      };

      const [voucher] = await Voucher.create([voucherDoc], { session });

      advance.status = "SETTLED";
      advance.voucherId = voucher._id;
      advance.voucherNumber = voucher.voucherNumber;
      advance.settlement = {
        settledAt: new Date(),
        actualExpense: expense,
        returnedAmount: returned,
        variance,
        paymentMode: paymentMode || "CASH",
        paymentRef: paymentRef || "",
        notes: notes ? notes.trim() : "",
        items: parsedItems,
        settledBy: req.user.id,
      };

      await advance.save({ session });

      await AuditLog.create(
        [
          {
            action: "ADVANCE_SETTLED",
            performedBy: req.user.id,
            targetUser: advance.givenTo.userId || null,
            entity: "CashAdvance",
            entityId: advance._id,
            details: {
              advanceNumber: advance.advanceNumber,
              voucherNumber: voucher.voucherNumber,
              advanceAmount: advance.advanceAmount,
              actualExpense: expense,
              returnedAmount: returned,
              variance,
            },
            ipAddress: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
            userAgent: req.headers["user-agent"] || "",
          },
        ],
        { session }
      );

      return { advance, voucher };
    });

    return res.status(200).json({
      success: true,
      message: "Cash advance settled and expense voucher generated successfully.",
      data: result,
    });
  } catch (err) {
    console.error("Error in settleAdvance:", err);
    return res.status(500).json({ message: "Server error settling cash advance." });
  }
};

/**
 * 4. Cancel Type A Cash Advance (OPEN only)
 * PATCH /api/finance/advances/:id/cancel
 */
exports.cancelAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid advance ID format." });
    }

    const advance = await CashAdvance.findById(id);
    if (!advance) {
      return res.status(404).json({ message: "Cash advance not found." });
    }

    if (advance.status !== "OPEN") {
      return res.status(400).json({
        message: `Cannot cancel advance in ${advance.status} status. Only OPEN advances can be cancelled.`,
      });
    }

    advance.status = "CANCELLED";
    if (reason) {
      advance.notes = `${advance.notes ? advance.notes + " | " : ""}Cancelled: ${reason.trim()}`;
    }
    await advance.save();

    await AuditLog.create({
      action: "ADVANCE_CANCELLED",
      performedBy: req.user.id,
      targetUser: advance.givenTo.userId || null,
      entity: "CashAdvance",
      entityId: advance._id,
      details: {
        advanceNumber: advance.advanceNumber,
        reason: reason || "No reason specified",
      },
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "0.0.0.0",
      userAgent: req.headers["user-agent"] || "",
    });

    return res.status(200).json({
      success: true,
      message: "Cash advance cancelled successfully.",
      data: advance,
    });
  } catch (err) {
    console.error("Error in cancelAdvance:", err);
    return res.status(500).json({ message: "Server error cancelling cash advance." });
  }
};

/**
 * 5. List Advances with filters
 * GET /api/finance/advances
 */
exports.listAdvances = async (req, res) => {
  try {
    const { status, type, category, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { advanceNumber: { $regex: search, $options: "i" } },
        { "givenTo.name": { $regex: search, $options: "i" } },
        { purpose: { $regex: search, $options: "i" } },
      ];
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 200;
    const skip = (page - 1) * limit;

    const [advances, total] = await Promise.all([
      CashAdvance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("addedBy", "name email phone"),
      CashAdvance.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: advances.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: advances,
    });
  } catch (err) {
    console.error("Error in listAdvances:", err);
    return res.status(500).json({ message: "Server error retrieving cash advances." });
  }
};

/**
 * 6. Get Single Advance by ID
 * GET /api/finance/advances/:id
 */
exports.getAdvanceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid advance ID format." });
    }

    const advance = await CashAdvance.findById(id)
      .populate("addedBy", "name email phone")
      .populate("givenTo.userId", "name email phone")
      .populate("voucherId");

    if (!advance) {
      return res.status(404).json({ message: "Cash advance not found." });
    }

    return res.status(200).json({
      success: true,
      data: advance,
    });
  } catch (err) {
    console.error("Error in getAdvanceById:", err);
    return res.status(500).json({ message: "Server error retrieving cash advance details." });
  }
};
