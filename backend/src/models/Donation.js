const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donationHead: String,
    amount: Number,
    paymentId: String,
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    transactionRef: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
