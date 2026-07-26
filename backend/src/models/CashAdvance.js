const mongoose = require("mongoose");
const { mainDb } = require("../config/db");

/**
 * Expense Categories Enum
 * Shared across CashAdvance, Voucher, and Settlement line items
 */
const EXPENSE_CATEGORIES = [
  "GROCERIES_PROVISIONS", // Vegetables, kiryana, etc.
  "ELECTRICITY_UTILITIES", // Electricity, water
  "MAINTENANCE_REPAIRS", // Repairs, plumbing, carpentry
  "STAFF_WAGES", // Daily wages, salaries
  "TRANSPORT", // Vehicle fuel, auto-rickshaw
  "MEDICAL", // Medicines, doctor fees
  "STATIONERY_OFFICE", // Paper, pens, printing
  "RELIGIOUS_CEREMONIES", // Pooja samagri, flowers, etc.
  "CONSTRUCTION", // Infrastructure
  "TELEPHONE_INTERNET", // Phone bills, broadband
  "HOSPITALITY", // Guest expenses, prasad
  "MISCELLANEOUS", // Other
];

/**
 * Payment Modes Enum
 */
const PAYMENT_MODES = ["CASH", "CHEQUE", "UPI", "RTGS", "NEFT"];

const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
  },
  { _id: false }
);

const cashAdvanceSchema = new mongoose.Schema(
  {
    advanceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true, // Rule B.7: Advance number immutable once issued
    },
    type: {
      type: String,
      enum: ["ADVANCE", "DIRECT_PAYMENT"],
      required: true,
    },
    givenTo: {
      name: { type: String, required: true, trim: true },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    advanceAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    // Filled on settlement (Type A only)
    settlement: {
      settledAt: { type: Date, default: null },
      actualExpense: { type: Number, default: null, min: 0 },
      returnedAmount: {
        type: Number,
        default: null,
        min: 0,
        validate: {
          validator: function (value) {
            if (value === null || value === undefined) return true;
            return value <= this.advanceAmount;
          },
          message: "Returned amount cannot exceed advance amount.",
        },
      },
      variance: { type: Number, default: null }, // advanceAmount - actualExpense - returnedAmount
      paymentMode: {
        type: String,
        enum: [...PAYMENT_MODES, null],
        default: null,
      },
      paymentRef: { type: String, trim: true, default: "" },
      notes: { type: String, trim: true, default: "" },
      items: [lineItemSchema],
      settledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
    },
    // For Type B (direct payment) — filled at creation
    directPayment: {
      paymentMode: {
        type: String,
        enum: [...PAYMENT_MODES, null],
        default: null,
      },
      paymentRef: { type: String, trim: true, default: "" },
      paymentDate: { type: Date, default: null },
      bankName: { type: String, trim: true, default: "" },
      accountNo: { type: String, trim: true, default: "" },
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Voucher",
      default: null,
    },
    voucherNumber: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["OPEN", "SETTLED", "CANCELLED"],
      default: "OPEN",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent editing or modifying immutable reference after voucher generation
cashAdvanceSchema.path("voucherId").validate(function (value) {
  if (this.isModified("voucherId") && !this.isNew && this._originalVoucherId) {
    return false;
  }
  return true;
}, "voucherId is immutable once set.");

// Indexes as specified in B.5
cashAdvanceSchema.index({ status: 1, createdAt: -1 });
cashAdvanceSchema.index({ "givenTo.userId": 1 });
cashAdvanceSchema.index({ voucherId: 1 });
cashAdvanceSchema.index({ category: 1 });
cashAdvanceSchema.index({ createdAt: -1 });

module.exports =
  mainDb.models.CashAdvance || mainDb.model("CashAdvance", cashAdvanceSchema);
module.exports.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
module.exports.PAYMENT_MODES = PAYMENT_MODES;
