const mongoose = require("mongoose");

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
  },
  { timestamps: true },
);

userSchema.index({ role: 1 });
module.exports = mongoose.model("User", userSchema);
