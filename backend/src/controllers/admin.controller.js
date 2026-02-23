const Donation = require("../models/Donation");
const User = require("../models/User");
const path = require("path");
const fs = require("fs");
const { generateDonationReceipt } = require("../services/receipt.service");
const { sendDonationReceiptEmail } = require("../services/email.service");
const { getKycDocumentPath, deleteKycDocuments } = require("../services/kyc.service");
const { assignReferralCode } = require("../services/collector.service");
const { logCollectorApproval, logCollectorRejection } = require("../services/audit.service");

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
    if (paymentMethod) {
      // Support comma-separated methods for future flexibility
      if (paymentMethod.includes(",")) {
        filter.paymentMethod = { $in: paymentMethod.split(",") };
      } else {
        filter.paymentMethod = paymentMethod;
      }
    }
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
 * Create offline donation (Admin only) - supports CASH, UPI, CHEQUE
 * POST /api/admin/system/donations/cash  (backward-compatible route)
 * POST /api/admin/system/donations/offline (new route alias)
 * Admin can add donations with donor details and payment method
 */
exports.createCashDonation = async (req, res) => {
  try {
    const { donor, donationHead, amount, paymentDate, paymentMethod, paymentDetails } = req.body;

    // Validate required fields
    if (!donor || !donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    // Determine effective payment method (backward compat: default to CASH)
    const effectiveMethod = paymentMethod || "CASH";
    const validMethods = ["CASH", "UPI", "CHEQUE"];
    if (!validMethods.includes(effectiveMethod)) {
      return res.status(400).json({ message: `Invalid payment method. Must be one of: ${validMethods.join(", ")}` });
    }

    // Validate payment-method-specific required fields
    if (effectiveMethod === "UPI") {
      if (!paymentDetails?.utrNumber || !paymentDetails.utrNumber.trim()) {
        return res.status(400).json({ message: "UTR number is required for UPI payments" });
      }
    }
    if (effectiveMethod === "CHEQUE") {
      if (!paymentDetails?.chequeNumber || !paymentDetails.chequeNumber.trim()) {
        return res.status(400).json({ message: "Cheque number is required for cheque payments" });
      }
      if (!paymentDetails?.bankName || !paymentDetails.bankName.trim()) {
        return res.status(400).json({ message: "Bank name is required for cheque payments" });
      }
    }

    // Validate donor object
    const {
      name,
      mobile,
      email,
      address,
      addressObj,
      anonymousDisplay,
      dob,
      idType,
      idNumber,
    } = donor;

    // Validate required fields - address can come as legacy string OR structured addressObj
    const hasAddress = address || (addressObj && (addressObj.line || addressObj.city));
    if (!name || !hasAddress || !dob || !idType || !idNumber) {
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

    // Build structured address if provided
    const structuredAddress = addressObj ? {
      line: addressObj.line || "",
      city: addressObj.city || "",
      state: addressObj.state || "",
      country: addressObj.country || "India",
      pincode: addressObj.pincode || "",
    } : undefined;

    // Build legacy address string for backward compatibility
    const legacyAddress = address || (structuredAddress
      ? [structuredAddress.line, structuredAddress.city, structuredAddress.state, structuredAddress.country, structuredAddress.pincode].filter(Boolean).join(", ")
      : "");

    // Generate unique transaction reference
    const methodPrefix = effectiveMethod === "UPI" ? "UPI" : effectiveMethod === "CHEQUE" ? "CHQ" : "CASH";
    const transactionRef = `${methodPrefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Build payment sub-document
    const paymentDoc = {
      method: effectiveMethod,
      status: "SUCCESS",
    };
    if (effectiveMethod === "UPI" && paymentDetails?.utrNumber) {
      paymentDoc.utrNumber = paymentDetails.utrNumber.trim();
    }
    if (effectiveMethod === "CHEQUE") {
      if (paymentDetails?.chequeNumber) paymentDoc.chequeNumber = paymentDetails.chequeNumber.trim();
      if (paymentDetails?.bankName) paymentDoc.bankName = paymentDetails.bankName.trim();
      if (paymentDetails?.chequeDate) paymentDoc.chequeDate = new Date(paymentDetails.chequeDate);
    }

    // Create donation with donor snapshot - directly as SUCCESS
    const donation = await Donation.create({
      user: userId,
      donor: {
        name,
        mobile: mobile || "N/A",
        email: email || undefined,
        emailOptIn: !!email,
        emailVerified: false,
        address: legacyAddress,
        addressObj: structuredAddress || undefined,
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
      paymentMethod: effectiveMethod,
      payment: paymentDoc,
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
      message: `${effectiveMethod} donation recorded successfully`,
      donationId: donation._id,
      receiptNumber: donation.receiptNumber,
      receiptUrl: donation.receiptUrl,
      transactionRef: donation.transactionRef,
      paymentMethod: effectiveMethod,
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
    // BUG FIX: Only count donations with explicit hasCollectorAttribution flag
    const collectorStats = await Donation.aggregate([
      {
        $match: {
          hasCollectorAttribution: true, // Only explicit attributions
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
    // BUG FIX: Only count donations with explicit hasCollectorAttribution flag
    const totalCollectors = await Donation.aggregate([
      { $match: { hasCollectorAttribution: true, collectorId: { $ne: null }, status: "SUCCESS" } },
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
    // BUG FIX: Only count donations with explicit hasCollectorAttribution flag
    const stats = await Donation.aggregate([
      { $match: { hasCollectorAttribution: true, collectorId: user._id, status: "SUCCESS" } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    // Get donations attributed to this collector (limited info for privacy)
    // BUG FIX: Only show donations with explicit hasCollectorAttribution flag
    const donations = await Donation.find({
      hasCollectorAttribution: true,
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
      message: `Collector ${user.collectorDisabled ? "disabled" : "enabled"} successfully`,
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
    // BUG FIX: Only count donations with explicit hasCollectorAttribution flag
    const activeCollectors = await Donation.aggregate([
      { $match: { hasCollectorAttribution: true, collectorId: { $ne: null }, status: "SUCCESS" } },
      { $group: { _id: "$collectorId" } },
      { $count: "total" },
    ]);

    // Donations with vs without referral
    // BUG FIX: Use hasCollectorAttribution flag instead of collectorId null check
    const referralStats = await Donation.aggregate([
      { $match: { status: "SUCCESS" } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$hasCollectorAttribution", true] }, "with_referral", "without_referral"] },
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

// ==================== COLLECTOR KYC MANAGEMENT ====================

/**
 * Get all pending collector applications
 * GET /api/admin/system/collector-applications
 */
exports.getCollectorApplications = async (req, res) => {
  try {
    const { status = "pending" } = req.query;

    // Validate status filter
    const validStatuses = ["pending", "approved", "rejected", "all"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status filter. Use: pending, approved, rejected, or all",
      });
    }

    const filter = {};
    if (status !== "all") {
      filter["collectorProfile.status"] = status;
    } else {
      // For 'all', get users with any collectorProfile status except 'none'
      filter["collectorProfile.status"] = { $in: ["pending", "approved", "rejected"] };
    }

    const applications = await User.find(filter)
      .select("fullName email mobile role collectorProfile createdAt")
      .sort({ "collectorProfile.submittedAt": -1 });

    // Map to response format expected by frontend
    const result = applications.map((user) => ({
      userId: user._id,
      fullName: user.collectorProfile?.fullName || user.fullName,
      email: user.email,
      mobile: user.mobile,
      role: user.role,
      address: user.collectorProfile?.address,
      panNumber: user.collectorProfile?.panNumber,
      status: user.collectorProfile?.status,
      submittedAt: user.collectorProfile?.submittedAt,
      approvedAt: user.collectorProfile?.approvedAt,
      rejectedReason: user.collectorProfile?.rejectedReason,
      hasAadharFront: !!user.collectorProfile?.aadharFront?.fileKey,
      hasAadharBack: !!user.collectorProfile?.aadharBack?.fileKey,
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      applications: result,
    });
  } catch (error) {
    console.error("Get collector applications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collector applications",
    });
  }
};

/**
 * Approve collector application
 * POST /api/admin/system/collector/:userId/approve
 */
exports.approveCollectorApplication = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate current state
    if (user.role !== "COLLECTOR_PENDING") {
      return res.status(400).json({
        success: false,
        message: "User does not have a pending collector application",
      });
    }

    if (!user.collectorProfile || user.collectorProfile.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending application found for this user",
      });
    }

    // Approve the application
    user.role = "COLLECTOR_APPROVED";
    user.collectorProfile.status = "approved";
    user.collectorProfile.approvedAt = new Date();
    user.collectorProfile.rejectedReason = null;

    await user.save();

    // Generate referral code if not exists
    let referralCode = user.referralCode;
    if (!referralCode) {
      referralCode = await assignReferralCode(user._id);
    }

    // Audit log: Collector approved
    logCollectorApproval(user._id, user.collectorProfile.fullName, req.user.id);

    res.status(200).json({
      success: true,
      message: "Collector application approved successfully",
      data: {
        userId: user._id,
        role: user.role,
        status: user.collectorProfile.status,
        approvedAt: user.collectorProfile.approvedAt,
        referralCode: referralCode,
      },
    });
  } catch (error) {
    console.error("Approve collector error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve collector application",
    });
  }
};

/**
 * Reject collector application
 * POST /api/admin/system/collector/:userId/reject
 */
exports.rejectCollectorApplication = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required (minimum 5 characters)",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate current state
    if (user.role !== "COLLECTOR_PENDING") {
      return res.status(400).json({
        success: false,
        message: "User does not have a pending collector application",
      });
    }

    if (!user.collectorProfile || user.collectorProfile.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "No pending application found for this user",
      });
    }

    // Reject the application
    user.role = "USER";
    user.collectorProfile.status = "rejected";
    user.collectorProfile.rejectedReason = reason.trim();

    await user.save();

    // Audit log: Collector rejected
    logCollectorRejection(user._id, user.collectorProfile.fullName, req.user.id, reason.trim());

    res.status(200).json({
      success: true,
      message: "Collector application rejected",
      data: {
        userId: user._id,
        role: user.role,
        status: user.collectorProfile.status,
        rejectedReason: user.collectorProfile.rejectedReason,
      },
    });
  } catch (error) {
    console.error("Reject collector error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject collector application",
    });
  }
};

/**
 * View KYC document (admin only)
 * GET /api/admin/system/collector/:userId/kyc/:type
 * 
 * Securely streams KYC document to admin
 * Does NOT expose direct file path
 */
exports.viewKycDocument = async (req, res) => {
  try {
    const { userId, type } = req.params;

    // Validate type parameter
    if (!type || !["front", "back"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type. Use 'front' or 'back'",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has KYC documents
    if (!user.collectorProfile) {
      return res.status(404).json({
        success: false,
        message: "No collector profile found for this user",
      });
    }

    // Get the appropriate document
    const document = type === "front"
      ? user.collectorProfile.aadharFront
      : user.collectorProfile.aadharBack;

    if (!document || !document.fileKey) {
      return res.status(404).json({
        success: false,
        message: `Aadhar ${type} document not found`,
      });
    }

    // Get the file path securely
    const filePath = getKycDocumentPath(document.fileKey);
    if (!filePath) {
      return res.status(404).json({
        success: false,
        message: "Document file not found on server",
      });
    }

    // Stream the file with proper headers
    res.setHeader("Content-Type", "image/webp");
    res.setHeader("Content-Disposition", `inline; filename="aadhar_${type}.webp"`);
    res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    // Create read stream and pipe to response
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (err) => {
      console.error("File stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Error reading document file",
        });
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error("View KYC document error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve KYC document",
    });
  }
};

/**
 * Revoke collector status
 * POST /api/admin/system/collector/:userId/revoke
 * 
 * Revokes an approved collector back to regular user
 */
exports.revokeCollectorStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "Revocation reason is required (minimum 5 characters)",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate current state
    if (user.role !== "COLLECTOR_APPROVED") {
      return res.status(400).json({
        success: false,
        message: "User is not an approved collector",
      });
    }

    // Revoke the collector status
    user.role = "USER";
    user.collectorProfile.status = "rejected";
    user.collectorProfile.rejectedReason = `Revoked: ${reason.trim()}`;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Collector status revoked successfully",
      data: {
        userId: user._id,
        role: user.role,
        status: user.collectorProfile.status,
      },
    });
  } catch (error) {
    console.error("Revoke collector error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to revoke collector status",
    });
  }
};
