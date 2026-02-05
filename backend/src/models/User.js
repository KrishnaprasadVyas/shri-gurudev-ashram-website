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
      enum: ["USER", "WEBSITE_ADMIN", "SYSTEM_ADMIN"],
      default: "USER",
    },
    // Collector/Referral system - permanent, human-readable code
    referralCode: {
      type: String,
      unique: true,
      sparse: true, // Allows null values while maintaining uniqueness
      immutable: true, // Cannot be changed after creation
    },
    // Admin can disable a collector's referral code (soft-disable)
    collectorDisabled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
userSchema.index({ referralCode: 1 }); // Fast lookup for donation attribution

module.exports = mongoose.model("User", userSchema);
