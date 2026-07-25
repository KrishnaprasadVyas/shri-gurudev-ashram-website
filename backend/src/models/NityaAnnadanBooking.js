const mongoose = require("mongoose");
const { mainDb } = require("../config/db");

/**
 * Helper: Generate unique Nitya Annadan Booking Reference (e.g. ANN-A1B2C3)
 */
const generateBookingReference = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ANN-${code}`;
};

const nityaAnnadanBookingSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: generateBookingReference,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    sevaType: {
      type: String,
      default: "annadan",
    },
    sevaDate: {
      type: String,
      required: true,
      index: true, // ISO format YYYY-MM-DD
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 2100,
    },
    status: {
      type: String,
      enum: ["payment_pending", "paid", "cancelled"],
      default: "payment_pending",
      index: true,
    },
    notes: {
      type: String,
      default: null,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "UPI", "CHEQUE"],
      default: "ONLINE",
    },
    createdOffline: {
      type: Boolean,
      default: false,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound Indexes for fast queries
nityaAnnadanBookingSchema.index({ userId: 1, createdAt: -1 });
nityaAnnadanBookingSchema.index({ sevaDate: 1, status: 1 });

module.exports =
  mainDb.models.NityaAnnadanBooking ||
  mainDb.model("NityaAnnadanBooking", nityaAnnadanBookingSchema);
module.exports.generateBookingReference = generateBookingReference;
