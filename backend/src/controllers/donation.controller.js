const Donation = require("../models/Donation");
const razorpay = require("../config/razorpay");
const { v4: uuidv4 } = require("uuid");

exports.createDonation = async (req, res) => {
  try {
    const { donationHead, amount, donorIdType, donorIdNumber, donorDob } =
      req.body;

    if (!donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    if (!donorDob || !donorIdNumber) {
      return res.status(400).json({ message: "Missing donor details" });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const aadhaarRegex = /^[0-9]{12}$/;

    if (!["PAN", "AADHAAR"].includes(donorIdType)) {
      return res.status(400).json({ message: "Invalid ID type" });
    }

    if (donorIdType === "PAN" && !panRegex.test(donorIdNumber)) {
      return res.status(400).json({ message: "Invalid PAN number" });
    }

    if (donorIdType === "AADHAAR" && !aadhaarRegex.test(donorIdNumber)) {
      return res.status(400).json({ message: "Invalid Aadhaar number" });
    }

    const dob = new Date(donorDob);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ message: "Invalid date of birth" });
    }

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    if (age < 18) {
      return res.status(400).json({ message: "Donor must be 18+" });
    }

    const donation = await Donation.create({
      user: req.user.id,
      amount,
      donationHead,
      donorDob: dob,
      donorIdType,
      donorIdNumber,
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

exports.getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
};
