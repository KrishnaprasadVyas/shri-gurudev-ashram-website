const mongoose = require("mongoose");

/**
 * Donation Schema
 * Stores complete donor snapshot at time of donation
 * This ensures donation records are self-contained and immutable
 * 
 * Collector fields:
 * - collectorId: Reference to User who referred the donation (nullable)
 * - collectorName: Snapshot of collector's name at donation time (for receipts)
 * 
 * MIGRATION NOTES (v2 - Structured Address & Unified Payment):
 * - donor.address: Old field kept for backward compatibility (plain string)
 * - donor.addressObj: New structured address { line, city, state, country, pincode }
 * - payment: New unified payment sub-document
 * - Old paymentMethod/paymentId/razorpayOrderId/transactionRef kept for backward compat
 * - Virtuals and helpers provide unified access regardless of data format
 */
const donationSchema = new mongoose.Schema(
  {
    // Optional reference to registered user (the donor)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // === COLLECTOR/REFERRAL (nullable - donation may not have a collector) ===
    collectorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      default: null 
    },
    collectorName: { 
      type: String, 
      default: null 
    }, // Snapshot for receipts - avoids future lookups
    // BUG FIX: Explicit flag for collector attribution
    // Only set to true when referralCode was explicitly provided at donation time
    // Historical donations without this field are treated as false (no collector attribution)
    // This prevents old donations from appearing in collector stats
    hasCollectorAttribution: {
      type: Boolean,
      default: false,
    },

    // === DONOR SNAPSHOT (captured at donation time) ===
    donor: {
      name: { type: String, required: true },
      mobile: { type: String, required: true }, // Can be "N/A" for cash donations
      email: { type: String },
      emailOptIn: { type: Boolean, default: false },
      emailVerified: { type: Boolean, default: false },
      // LEGACY: Plain text address (kept for backward compatibility with old records)
      address: { type: String },
      // NEW (v2): Structured address object
      addressObj: {
        line: { type: String },
        city: { type: String },
        state: { type: String },
        country: { type: String, default: "India" },
        pincode: { type: String },
      },
      anonymousDisplay: { type: Boolean, default: false },
      dob: { type: Date, required: true },
      idType: { type: String, enum: ["PAN"], default: "PAN", required: true },
      idNumber: { type: String, required: true }, // PAN number stored as-is
    },

    // === DONATION DETAILS ===
    donationHead: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    amount: { type: Number, required: true },

    // === PAYMENT INFO (LEGACY - kept for backward compatibility) ===
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "CASH", "UPI", "CHEQUE"],
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

    // === NEW (v2): Unified Payment Sub-Document ===
    payment: {
      method: {
        type: String,
        enum: ["ONLINE", "CASH", "UPI", "CHEQUE"],
      },
      status: {
        type: String,
        enum: ["PENDING", "SUCCESS", "FAILED"],
      },
      utrNumber: { type: String },       // For UPI payments
      chequeNumber: { type: String },     // For cheque payments
      bankName: { type: String },         // For cheque payments
      chequeDate: { type: Date },         // For cheque payments
    },

    // === RECEIPT ===
    receiptUrl: String,
    receiptNumber: String,
    emailSent: { type: Boolean, default: false },

    // === OTP VERIFICATION ===
    otpVerified: { type: Boolean, default: false },

    // === ADMIN INFO (for cash/upi/cheque donations) ===
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

/**
 * Virtual: Get display-ready city from either structured or legacy address
 * Used by public API for "Recent Donations" location display
 */
donationSchema.methods.getDisplayCity = function () {
  // Prefer structured address
  if (this.donor?.addressObj?.city) {
    return this.donor.addressObj.city;
  }
  // Fallback: parse from legacy plain-text address
  return extractCityFromString(this.donor?.address);
};

/**
 * Virtual: Get full formatted address from either format
 */
donationSchema.methods.getFullAddress = function () {
  const addr = this.donor?.addressObj;
  if (addr && (addr.line || addr.city)) {
    const parts = [addr.line, addr.city, addr.state, addr.country, addr.pincode].filter(Boolean);
    return parts.join(", ");
  }
  return this.donor?.address || "";
};

/**
 * Virtual: Get effective payment method (unified access)
 */
donationSchema.methods.getPaymentMethod = function () {
  return this.payment?.method || this.paymentMethod || "ONLINE";
};

/**
 * Virtual: Get effective payment status (unified access)
 */
donationSchema.methods.getPaymentStatus = function () {
  return this.payment?.status || this.status || "PENDING";
};

/**
 * Helper: Extract city from legacy plain-text address
 */
function extractCityFromString(address) {
  if (!address) return "India";
  const withoutPincode = address.replace(/[-\s]?\d{6}\s*$/, "").trim();
  const parts = withoutPincode.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const cityPart = parts.length >= 3 ? parts[parts.length - 2] : parts[parts.length - 1];
    const cleanCity = cityPart
      .replace(/\b(Maharashtra|Gujarat|Karnataka|Tamil Nadu|Delhi|Rajasthan|UP|MP|Bihar|West Bengal|Telangana|Andhra Pradesh)\b/gi, "")
      .trim();
    if (cleanCity && cleanCity.length > 1) return cleanCity;
  }
  return "India";
}

// Export helper for use in public controller
donationSchema.statics.extractCityFromString = extractCityFromString;

// Index for user donations lookup
donationSchema.index({ user: 1, createdAt: -1 });
donationSchema.index({ collectorId: 1, createdAt: -1 }); // Leaderboard & collector stats
donationSchema.index({ hasCollectorAttribution: 1, status: 1 }); // BUG FIX: Optimized collector queries
donationSchema.index({ "donor.mobile": 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ paymentMethod: 1 });
donationSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Donation", donationSchema);
