const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  mobile: String,
  otpHash: String,
  expiresAt: Date,
});

module.exports = mongoose.model("Otp", otpSchema);
