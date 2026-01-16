const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    mobile: { type: String, required: true },
    whatsapp: String,
    address: String,
    role: {
      type: String,
      enum: ["USER", "WEBSITE_ADMIN", "SYSTEM_ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });
module.exports = mongoose.model("User", userSchema);
