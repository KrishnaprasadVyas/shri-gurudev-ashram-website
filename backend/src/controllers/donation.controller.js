const Donation = require("../models/Donation");
const razorpay = require("../config/razorpay");
const { v4: uuidv4 } = require("uuid");

exports.createDonation = async (req, res) => {
  try {
    const { donationHead, amount } = req.body;

    if (!donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    const donation = await Donation.create({
      user: req.user._id,
      donationHead,
      amount,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Donation initiated",
      donationId: donation._id,
      status: donation.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createDonationOrder = async (req, res) => {
  try {
    const { donationId } = req.body;

    if (!donationId) {
      return res.status(400).json({ message: "Donation ID required" });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    const options = {
      amount: donation.amount * 100,
      currency: "INR",
      receipt: donation._id.toString().slice(-12),
    };

    const order = await razorpay.orders.create(options);

    donation.razorpayOrderId = order.id;
    await donation.save();

    res.json({
      razorpayOrderId: order.id,
      amount: donation.amount,
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};
