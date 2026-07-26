const mongoose = require("mongoose");
const { mainDb } = require("../config/db");
const { EXPENSE_CATEGORIES, PAYMENT_MODES } = require("./CashAdvance");

const voucherLineItemSchema = new mongoose.Schema(
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

const voucherSchema = new mongoose.Schema(
  {
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      immutable: true, // Rule B.7: Voucher number immutable once issued
    },
    sourceType: {
      type: String,
      enum: ["ADVANCE_SETTLEMENT", "DIRECT_PAYMENT"],
      required: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashAdvance",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: EXPENSE_CATEGORIES,
      required: true,
    },
    // Financial summary (denormalized for quick display)
    advanceAmount: { type: Number, default: null, min: 0 },
    actualAmount: { type: Number, required: true, min: 0 },
    returnedAmount: { type: Number, default: null, min: 0 },
    paymentMode: {
      type: String,
      enum: [...PAYMENT_MODES, null],
      default: null,
    },
    paymentRef: { type: String, trim: true, default: "" },
    bankName: { type: String, trim: true, default: "" },
    paymentDate: { type: Date, default: null },
    items: [voucherLineItemSchema],
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    pdfPath: { type: String, default: null },
    pdfGeneratedAt: { type: Date, default: null },
    preparedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent voucher modification after creation (permanent financial records)
voucherSchema.pre("save", function () {
  if (!this.isNew) {
    throw new Error("Vouchers are immutable financial records and cannot be edited.");
  }
});

voucherSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();
  if (!update) return;
  const allowedKeys = ["pdfPath", "pdfGeneratedAt", "$set"];
  const updateKeys = Object.keys(update);
  for (const key of updateKeys) {
    if (key === "$set") {
      const setKeys = Object.keys(update.$set);
      for (const setKey of setKeys) {
        if (setKey !== "pdfPath" && setKey !== "pdfGeneratedAt") {
          throw new Error("Vouchers are immutable and only PDF cache paths can be updated.");
        }
      }
    } else if (!allowedKeys.includes(key)) {
      throw new Error("Vouchers are immutable and only PDF cache paths can be updated.");
    }
  }
});

// Block updateOne and updateMany from modifying anything other than pdfPath / pdfGeneratedAt
const checkUpdateQuery = function () {
  const update = this.getUpdate();
  if (!update) return;
  const allowedKeys = ["pdfPath", "pdfGeneratedAt", "$set"];
  const updateKeys = Object.keys(update);
  for (const key of updateKeys) {
    if (key === "$set") {
      const setKeys = Object.keys(update.$set);
      for (const setKey of setKeys) {
        if (setKey !== "pdfPath" && setKey !== "pdfGeneratedAt") {
          throw new Error("Vouchers are immutable and only PDF cache paths can be updated.");
        }
      }
    } else if (!allowedKeys.includes(key)) {
      throw new Error("Vouchers are immutable and only PDF cache paths can be updated.");
    }
  }
};

voucherSchema.pre("updateOne", checkUpdateQuery);
voucherSchema.pre("updateMany", checkUpdateQuery);

// Completely block all deletion attempts on Vouchers
const preventDelete = function () {
  throw new Error("Vouchers are permanent financial records and cannot be deleted.");
};
voucherSchema.pre("deleteOne", { document: true, query: true }, preventDelete);
voucherSchema.pre("deleteMany", preventDelete);
voucherSchema.pre("findOneAndDelete", preventDelete);
voucherSchema.pre("findOneAndRemove", preventDelete);

// Indexes as specified in B.5
voucherSchema.index({ sourceId: 1 });
voucherSchema.index({ date: -1 });
voucherSchema.index({ category: 1, date: -1 });
voucherSchema.index({ createdAt: -1 });

module.exports =
  mainDb.models.Voucher || mainDb.model("Voucher", voucherSchema);
