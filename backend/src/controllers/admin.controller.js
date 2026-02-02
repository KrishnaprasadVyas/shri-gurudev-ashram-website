const Donation = require("../models/Donation");
const User = require("../models/User");
const path = require("path");
const { generateDonationReceipt } = require("../services/receipt.service");
const { sendDonationReceiptEmail } = require("../services/email.service");

/**
 * Helper: Validate PAN number
 */
const validateGovtId = (idType, idNumber) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  if (idType !== "PAN") {
    return { valid: false, message: "Only PAN is accepted" };
  }

  if (!panRegex.test(idNumber.toUpperCase())) {
    return { valid: false, message: "Invalid PAN format (e.g., ABCDE1234F)" };
  }

  return { valid: true };
};

/**
 * Helper: Validate age (must be 18+)
 */
const validateAge = (dob) => {
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) {
    return { valid: false, message: "Invalid date of birth" };
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;

  if (age < 18) {
    return { valid: false, message: "Donor must be 18 years or older" };
  }

  return { valid: true };
};

/**
 * Get all donations with optional filters
 * GET /api/admin/system/donations
 */
exports.getAllDonations = async (req, res) => {
  try {
    const { paymentMethod, status, startDate, endDate } = req.query;

    const filter = {};
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endOfDay;
      }
    }

    const donations = await Donation.find(filter)
      .populate("user", "fullName email mobile")
      .populate("addedBy", "fullName")
      .sort({ createdAt: -1 });

    // Return donations with actual PAN numbers (no masking)
    res.json(donations);
  } catch (error) {
    console.error("Get donations error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Create cash donation (Admin only)
 * POST /api/admin/system/donations/cash
 * Admin can add cash donations with donor details
 */
exports.createCashDonation = async (req, res) => {
  try {
    const { donor, donationHead, amount, paymentDate } = req.body;

    // Validate required fields
    if (!donor || !donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    // Validate donor object
    const {
      name,
      mobile,
      email,
      address,
      anonymousDisplay,
      dob,
      idType,
      idNumber,
    } = donor;

    // Only name, address, dob, and ID are required for cash donations
    if (!name || !address || !dob || !idType || !idNumber) {
      return res.status(400).json({
        message: "Missing required donor details (name, address, dob, ID type, ID number)",
      });
    }

    // Validate donationHead object
    if (!donationHead.id || !donationHead.name) {
      return res.status(400).json({ message: "Invalid donation head format" });
    }

    // Validate government ID
    const idValidation = validateGovtId(idType, idNumber);
    if (!idValidation.valid) {
      return res.status(400).json({ message: idValidation.message });
    }

    // Validate age
    const ageValidation = validateAge(dob);
    if (!ageValidation.valid) {
      return res.status(400).json({ message: ageValidation.message });
    }

    // Check if user exists by mobile (if provided)
    let userId = null;
    if (mobile && mobile !== "N/A") {
      const existingUser = await User.findOne({ mobile });
      if (existingUser) {
        userId = existingUser._id;
      }
    }

    // Generate unique transaction reference for cash
    const transactionRef = `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create donation with donor snapshot - directly as SUCCESS
    const donation = await Donation.create({
      user: userId,
      donor: {
        name,
        mobile: mobile || "N/A",
        email: email || undefined,
        emailOptIn: !!email,
        emailVerified: false,
        address,
        anonymousDisplay: anonymousDisplay || false,
        dob: new Date(dob),
        idType,
        idNumber: idType === "PAN" ? idNumber.toUpperCase() : idNumber,
      },
      donationHead: {
        id: String(donationHead.id),
        name: donationHead.name,
      },
      amount,
      status: "SUCCESS",
      paymentMethod: "CASH",
      transactionRef,
      otpVerified: false,
      addedBy: req.user.id,
      createdAt: paymentDate ? new Date(paymentDate) : new Date(),
    });

    // Generate receipt number first
    const receiptNumber = `GDA-${Date.now()}-${donation._id.toString().slice(-6).toUpperCase()}`;
    donation.receiptNumber = receiptNumber;
    await donation.save();

    try {
      // Generate receipt PDF (function uses donation.receiptNumber)
      const receiptPath = await generateDonationReceipt(donation);
      donation.receiptUrl = `/receipts/${path.basename(receiptPath)}`;
      await donation.save();

      // Send email if email is provided and valid
      if (email && email.includes("@")) {
        try {
          await sendDonationReceiptEmail(
            email,
            name,
            receiptPath,
            receiptNumber,
            amount,
            donationHead.name
          );
          donation.emailSent = true;
          await donation.save();
        } catch (emailError) {
          console.error("Failed to send receipt email:", emailError);
          // Don't fail the request if email fails
        }
      }
    } catch (receiptError) {
      console.error("Failed to generate receipt:", receiptError);
      // Continue even if receipt generation fails
    }

    res.status(201).json({
      message: "Cash donation recorded successfully",
      donationId: donation._id,
      receiptNumber: donation.receiptNumber,
      receiptUrl: donation.receiptUrl,
      transactionRef: donation.transactionRef,
      status: donation.status,
    });
  } catch (error) {
    console.error("Create cash donation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const donors = await User.find({ role: "USER" }).select(
      "fullName email mobile createdAt"
    );

    res.json(donors);
  } catch (error) {
    console.error("Get donors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getReports = async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;

    const matchFilter = { status: "SUCCESS" };
    if (paymentMethod) matchFilter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        matchFilter.createdAt.$lte = endOfDay;
      }
    }

    // Total amount
    const totalAmount = await Donation.aggregate([
      { $match: matchFilter },
      { $group: { _id: null, sum: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // By payment method
    const byPaymentMethod = await Donation.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: "$paymentMethod",
          sum: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    // By donation head
    const byDonationHead = await Donation.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$donationHead.name",
          sum: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { sum: -1 } },
    ]);

    res.json({
      totalAmount: totalAmount[0]?.sum || 0,
      totalCount: totalAmount[0]?.count || 0,
      byPaymentMethod: byPaymentMethod.reduce((acc, item) => {
        acc[item._id || "ONLINE"] = { amount: item.sum, count: item.count };
        return acc;
      }, {}),
      byDonationHead,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
