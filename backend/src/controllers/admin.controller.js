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

/**
 * Get all collectors with stats (Admin only)
 * GET /api/admin/system/collectors
 * Returns all users who have made referral attributions
 */
exports.getAllCollectors = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get collector stats from donations
    const collectorStats = await Donation.aggregate([
      {
        $match: {
          collectorId: { $ne: null },
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: "$collectorId",
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          collectorName: { $last: "$collectorName" },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Get total count for pagination
    const totalCollectors = await Donation.aggregate([
      { $match: { collectorId: { $ne: null }, status: "SUCCESS" } },
      { $group: { _id: "$collectorId" } },
      { $count: "total" },
    ]);

    // Enrich with user details (disabled status, referral code)
    const collectorIds = collectorStats.map((c) => c._id);
    const users = await User.find({ _id: { $in: collectorIds } })
      .select("_id fullName referralCode collectorDisabled")
      .lean();

    const userMap = users.reduce((acc, u) => {
      acc[u._id.toString()] = u;
      return acc;
    }, {});

    const collectors = collectorStats.map((stat, index) => {
      const user = userMap[stat._id.toString()] || {};
      return {
        rank: skip + index + 1,
        collectorId: stat._id,
        collectorName: user.fullName || stat.collectorName || "Unknown",
        referralCode: user.referralCode || null,
        collectorDisabled: user.collectorDisabled || false,
        totalAmount: stat.totalAmount,
        donationCount: stat.donationCount,
      };
    });

    res.json({
      collectors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCollectors[0]?.total || 0,
        totalPages: Math.ceil((totalCollectors[0]?.total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get collectors error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get collector details with donations (Admin only)
 * GET /api/admin/system/collectors/:id
 */
exports.getCollectorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user info
    const user = await User.findById(id)
      .select("_id fullName referralCode collectorDisabled createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "Collector not found" });
    }

    // Get collector stats
    const stats = await Donation.aggregate([
      { $match: { collectorId: user._id, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    // Get donations attributed to this collector (limited info for privacy)
    const donations = await Donation.find({
      collectorId: user._id,
      status: "SUCCESS",
    })
      .select("_id createdAt amount donationHead status")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Format donations (no donor PII)
    const formattedDonations = donations.map((d) => ({
      donationId: d._id,
      date: d.createdAt,
      amount: d.amount,
      cause: d.donationHead?.name || "General",
      status: d.status,
    }));

    res.json({
      collector: {
        id: user._id,
        name: user.fullName,
        referralCode: user.referralCode,
        disabled: user.collectorDisabled || false,
        createdAt: user.createdAt,
      },
      stats: {
        totalAmount: stats[0]?.totalAmount || 0,
        donationCount: stats[0]?.donationCount || 0,
      },
      donations: formattedDonations,
    });
  } catch (error) {
    console.error("Get collector details error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Toggle collector disabled status (Admin only)
 * PATCH /api/admin/system/collectors/:id/toggle-status
 * 
 * NOTE: This is a true toggle - it flips the current state.
 * No request body required. This prevents accidental state mismatches.
 */
exports.toggleCollectorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body; // Optional reason for audit

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Collector not found" });
    }

    // True toggle: flip current state (no client-provided value accepted)
    const previousState = user.collectorDisabled || false;
    user.collectorDisabled = !previousState;
    await user.save();

    // Audit log with admin ID, collector ID, and action
    console.log(
      `[ADMIN AUDIT] CollectorToggle | Admin: ${req.user.id} | Collector: ${user._id} (${user.fullName}) | Action: ${
        user.collectorDisabled ? "DISABLED" : "ENABLED"
      } | Previous: ${previousState ? "DISABLED" : "ENABLED"} | Reason: ${reason || "Not specified"}`
    );

    res.json({
      message: `Collector ${disabled ? "disabled" : "enabled"} successfully`,
      collector: {
        id: user._id,
        name: user.fullName,
        disabled: user.collectorDisabled,
      },
    });
  } catch (error) {
    console.error("Toggle collector status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get collector summary stats for admin dashboard
 * GET /api/admin/system/collectors/summary
 */
exports.getCollectorSummary = async (req, res) => {
  try {
    // Total active collectors (users with at least 1 donation attributed)
    const activeCollectors = await Donation.aggregate([
      { $match: { collectorId: { $ne: null }, status: "SUCCESS" } },
      { $group: { _id: "$collectorId" } },
      { $count: "total" },
    ]);

    // Donations with vs without referral
    const referralStats = await Donation.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: { $cond: [{ $ne: ["$collectorId", null] }, "with_referral", "without_referral"] },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
    ]);

    const withReferral = referralStats.find((r) => r._id === "with_referral") || { count: 0, amount: 0 };
    const withoutReferral = referralStats.find((r) => r._id === "without_referral") || { count: 0, amount: 0 };

    res.json({
      activeCollectors: activeCollectors[0]?.total || 0,
      withReferral: {
        count: withReferral.count,
        amount: withReferral.amount,
      },
      withoutReferral: {
        count: withoutReferral.count,
        amount: withoutReferral.amount,
      },
    });
  } catch (error) {
    console.error("Get collector summary error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
