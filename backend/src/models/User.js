const mongoose = require("mongoose");

/**
 * User Schema
 * Every registered user automatically acts as a Collector.
 * referralCode: Unique, human-readable code for sharing donation links (e.g., COL123).
 * Generated once on registration, never changes.
 */
const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    // Email verification fields
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String, // Hashed token stored here
    emailVerificationExpiry: Date, // Token expiry timestamp
    mobile: { type: String, required: true },
    whatsapp: String,
    address: String,
    role: {
      type: String,
      enum: ["USER", "COLLECTOR_PENDING", "COLLECTOR_APPROVED", "WEBSITE_ADMIN", "SYSTEM_ADMIN"],
      default: "USER",
    },
    // Collector/Referral system - permanent, human-readable code
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      // Note: immutable:true was removed because it prevents setting the code
      // for existing users who don't have one yet. Code is still effectively
      // immutable since assignReferralCode() checks if it already exists.
    },
    // Admin can disable a collector's referral code (soft-disable)
    collectorDisabled: {
      type: Boolean,
      default: false,
    },
    // Collector KYC Profile - for verified collectors
    collectorProfile: {
      fullName: String,
      address: String,
      panNumber: String,
      aadharFront: {
        fileKey: String,
        uploadedAt: Date,
      },
      aadharBack: {
        fileKey: String,
        uploadedAt: Date,
      },
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      submittedAt: Date,
      approvedAt: Date,
      rejectedReason: String,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ referralCode: 1 }); // Fast lookup for donation attribution
userSchema.index({ "collectorProfile.status": 1 }); // Fast lookup for pending applications

module.exports = mongoose.model("User", userSchema);
