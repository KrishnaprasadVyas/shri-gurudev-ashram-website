const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    mobile: { type: String, required: true },
    whatsapp: String,
    address: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
