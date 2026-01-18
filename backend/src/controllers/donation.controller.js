const Donation = require("../models/Donation");
const razorpay = require("../config/razorpay");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");

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
      user: req.user?.id || null, // ← THIS FIX
      amount,
      donationHead,
      donorDob,
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
    const donations = await Donation.find({ user: req.user.id })
      .select("_id donationHead amount status createdAt receiptUrl")
      .sort({ createdAt: -1 });

    res.json(donations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
};

/**
 * Get donation status
 * PUBLIC endpoint - no auth required
 * Used by Step5Success polling for both guest and logged-in users
 * Safe: only returns status, no sensitive data
 */
exports.getDonationStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format to prevent DB errors
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    const donation = await Donation.findById(id).select("status");

    if (!donation) {
      return res.status(404).json({ status: "NOT_FOUND" });
    }

    res.json({ status: donation.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch donation status" });
  }
};

/**
 * Download donation receipt
 * PUBLIC endpoint - accessible via donationId (acts as access token)
 * Streams the existing PDF - does NOT regenerate
 * Only returns receipt if donation.status === "SUCCESS"
 */
exports.downloadReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid donation ID" });
    }

    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: "Donation not found" });
    }

    // Check if donation is successful
    if (donation.status !== "SUCCESS") {
      return res
        .status(403)
        .json({ message: "Receipt not available for this donation" });
    }

    // Check if receipt exists
    if (!donation.receiptUrl) {
      return res.status(404).json({ message: "Receipt not generated yet" });
    }

    // Construct receipt file path
    const receiptPath = path.join(
      __dirname,
      "../../receipts",
      path.basename(donation.receiptUrl)
    );

    if (!fs.existsSync(receiptPath)) {
      return res.status(404).json({ message: "Receipt file not found" });
    }

    // Set headers for PDF download
    const filename = `receipt-${donation.receiptNumber || donation._id}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(receiptPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to download receipt" });
  }
};
