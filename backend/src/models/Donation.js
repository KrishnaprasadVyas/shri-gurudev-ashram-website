const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    donorDob: {
      type: Date,
      required: true,
    },
    donorIdType: {
      type: String,
      enum: ["PAN", "AADHAAR"],
      required: true,
    },
    donorIdNumber: {
      type: String,
      required: true,
    },
    donationHead: { type: String, required: true },
    amount: { type: Number, required: true },
    razorpayOrderId: String,
    paymentId: String,
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    transactionRef: String,
    receiptUrl: String,
    receiptNumber: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Donation", donationSchema);
