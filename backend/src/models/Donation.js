const mongoose = require("mongoose");

/**
 * Donation Schema
 * Stores complete donor snapshot at time of donation
 * This ensures donation records are self-contained and immutable
 */
const donationSchema = new mongoose.Schema(
  {
    // Optional reference to registered user
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // === DONOR SNAPSHOT (captured at donation time) ===
    donor: {
      name: { type: String, required: true },
      mobile: { type: String, required: true }, // Can be "N/A" for cash donations
      email: { type: String },
      emailOptIn: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
      address: { type: String, required: true },
      anonymousDisplay: { type: Boolean, default: false },
      dob: { type: Date, required: true },
      idType: { type: String, enum: ["PAN", "AADHAAR"], required: true },
      idNumber: { type: String, required: true }, // Stored as-is, masked only in receipts/display
    },

    // === DONATION DETAILS ===
    donationHead: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    amount: { type: Number, required: true },

    // === PAYMENT INFO ===
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH"],
      default: "ONLINE",
    },
    razorpayOrderId: String,
    paymentId: String,
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    transactionRef: String,
    failureReason: String, // Stores reason if payment.failed

    // === RECEIPT ===
    receiptUrl: String,
    receiptNumber: String,
    emailSent: { type: Boolean, default: false },

    // === OTP VERIFICATION ===
    otpVerified: { type: Boolean, default: false },

    // === ADMIN INFO (for cash donations) ===
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Index for user donations lookup
donationSchema.index({ user: 1, createdAt: -1 });
donationSchema.index({ "donor.mobile": 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ paymentMethod: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Donation", donationSchema);
