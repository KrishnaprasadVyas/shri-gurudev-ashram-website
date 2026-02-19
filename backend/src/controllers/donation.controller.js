const Donation = require("../models/Donation");
const razorpay = require("../config/razorpay");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const bcrypt = require("bcrypt");
const { generateDonationReceipt } = require("../services/receipt.service");
const { sendDonationReceiptEmail } = require("../services/email.service");
const { sendLoginOtp } = require("../services/whatsapp.service");
const { resolveCollector, getTopCollectors, getCollectorStats, validateReferralCode } = require("../services/collector.service");
const { logDonationAttribution } = require("../services/audit.service");

/**
 * Helper: Validate PAN number
 */
const validateGovtId = (idType, idNumber) => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

  if (idType !== "PAN") {
    return { valid: false, message: "Only PAN is accepted" };
  }

  if (!panRegex.test(idNumber)) {
    return { valid: false, message: "Invalid PAN number format" };
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
 * Send OTP for donation verification
 * POST /donations/send-otp
 */
exports.sendDonationOtp = async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    // Clean mobile number - remove + and any non-digits
    let cleanMobile = mobile.replace(/[^\d]/g, '');

    // Normalize to 10-digit phone (strip country code if present)
    const phone10 = cleanMobile.startsWith("91") && cleanMobile.length === 12
      ? cleanMobile.slice(2)
      : cleanMobile;

    // Validate phone format (should be 10 digits)
    if (!/^\d{10}$/.test(phone10)) {
      return res.status(400).json({ message: "Invalid mobile number format" });
    }

    // Store the normalized 10-digit mobile for OTP record
    const storedMobile = phone10;

    // Format phone number for WhatsApp (ensure 91 prefix)
    const phone = `91${phone10}`;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpHash = await bcrypt.hash(otp.toString(), 10);

    // Delete any existing OTPs for this mobile
    await Otp.deleteMany({ mobile: storedMobile });

    // Store OTP with 5 min expiry
    await Otp.create({
      mobile: storedMobile,
      otpHash,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    // Send OTP via WhatsApp
    const result = await sendLoginOtp(phone, otp.toString());

    if (!result.success) {
      // Clean up OTP record if WhatsApp send fails
      await Otp.deleteMany({ mobile: storedMobile });
      return res.status(500).json({ 
        message: "Failed to send OTP. Please try again." 
      });
    }

    console.log(`[DONATION OTP] Mobile: ${storedMobile}, OTP sent via WhatsApp`);

    res.json({ message: "OTP sent successfully", mobile: storedMobile });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

/**
 * Verify OTP for donation
 * POST /donations/verify-otp
 */
exports.verifyDonationOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile and OTP are required" });
    }

    // Clean the mobile number - remove + and any non-digit characters
    const cleanMobile = mobile.replace(/[^\d]/g, '');
    
    // Extract 10-digit phone number (remove country code 91)
    const phone = cleanMobile.startsWith('91') && cleanMobile.length === 12
      ? cleanMobile.slice(2)
      : cleanMobile;

    // Find the most recent OTP record for this mobile (10-digit or legacy formats)
    const mobileCandidates = [phone, `91${phone}`];
    const record = await Otp.findOne({ mobile: { $in: mobileCandidates } }).sort({ _id: -1 });

    if (!record) {
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    }

    if (record.expiresAt < new Date()) {
      await Otp.deleteMany({ mobile: { $in: mobileCandidates } });
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new one." });
    }

    const isValid = await bcrypt.compare(otp.toString(), record.otpHash);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Delete used OTP
    await Otp.deleteMany({ mobile: { $in: mobileCandidates } });

    res.json({
      verified: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ message: "OTP verification failed" });
  }
};

/**
 * Create donation record
 * POST /donations/create
 * Accepts full donor object and stores snapshot
 * Optional referralCode for collector attribution
 */
exports.createDonation = async (req, res) => {
  try {
    // FIX 1: Removed otpVerified from destructuring - never trust client input
    const { donor, donationHead, amount, referralCode } = req.body;

    // Validate required fields
    if (!donor || !donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    // Production hardening: Donation amount limits
    const MIN_DONATION = 10; // ₹10 minimum
    const MAX_DONATION = 10000000; // ₹1 crore maximum
    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount < MIN_DONATION) {
      return res.status(400).json({ message: `Minimum donation amount is ₹${MIN_DONATION}` });
    }
    if (numericAmount > MAX_DONATION) {
      return res.status(400).json({ message: `Maximum donation amount is ₹${MAX_DONATION.toLocaleString("en-IN")}` });
    }

    // Validate donor object
    const {
      name,
      mobile,
      email,
      emailOptIn,
      emailVerified,
      address,
      anonymousDisplay,
      dob,
      idType,
      idNumber,
    } = donor;

    if (!name || !mobile || !address || !dob || !idType || !idNumber) {
      return res
        .status(400)
        .json({ message: "Missing required donor details" });
    }

    // Validate donationHead object - must have valid id and name (not empty, not "null" string)
    if (!donationHead || 
        !donationHead.id || 
        !donationHead.name || 
        donationHead.id === "null" || 
        donationHead.name === "null" ||
        donationHead.id.trim() === "" ||
        donationHead.name.trim() === "") {
      return res.status(400).json({ message: "Please select a valid donation cause" });
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

    // Validate referral code if provided - REJECT on invalid
    let collector = null;
    let hasCollectorAttribution = false;
    
    if (referralCode && referralCode.trim()) {
      const validation = await validateReferralCode(referralCode);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: validation.error || "Invalid referral code" 
        });
      }
      collector = {
        collectorId: validation.collectorId,
        collectorName: validation.collectorName,
      };
      hasCollectorAttribution = true;
    }

    // Create donation with donor snapshot
    
    const donation = await Donation.create({
      user: req.user?.id || null,
      // Collector attribution (nullable - only set when valid referral code provided)
      collectorId: collector?.collectorId || null,
      collectorName: collector?.collectorName || null,
      hasCollectorAttribution,
      donor: {
        name,
        mobile,
        email: email || undefined,
        emailOptIn: emailOptIn || false,
        emailVerified: emailVerified || false,
        address,
        anonymousDisplay: anonymousDisplay || false,
        dob: new Date(dob),
        idType,
        idNumber,
      },
      donationHead: {
        id: donationHead.id,
        name: donationHead.name,
      },
      amount,
      paymentMethod: "ONLINE",
      // FIX 1: Always false - only set true server-side after OTP verification
      otpVerified: false,
      status: "PENDING",
    });

    // Audit log: Donation attributed to collector
    if (hasCollectorAttribution && collector) {
      logDonationAttribution(donation._id, collector.collectorId, collector.collectorName, amount);
    }

    res.status(201).json({
      message: "Donation initiated",
      donationId: donation._id,
      status: donation.status,
    });
  } catch (error) {
    console.error("Create donation error:", error);
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
      amount: options.amount, // Return amount in paise for Razorpay
      currency: "INR",
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/**
 * ❌ REMOVED: verifyPayment
 *
 * Payment verification is now handled EXCLUSIVELY by Razorpay webhook.
 * Frontend should NOT call any backend endpoint to confirm payment.
 * After Razorpay checkout completes, frontend should:
 *   1. Navigate to Step5Success page
 *   2. Poll GET /donations/:id/status
 *   3. Wait for webhook to update status to SUCCESS or FAILED
 *
 * If webhook is down, donation MUST remain PENDING forever.
 * This is by design - we NEVER trust frontend payment callbacks.
 */

/**
 * Get user's donations (JWT protected)
 * GET /user/donations
 */
exports.getUserDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ user: req.user.id })
      .select(
        "_id donationHead donor amount status createdAt receiptUrl receiptNumber",
      )
      .sort({ createdAt: -1 });

    // Format response with display name handling
    const formattedDonations = donations.map((d) => {
      const donorObj = d.donor.toObject ? d.donor.toObject() : d.donor;
      return {
        _id: d._id,
        donationHead: d.donationHead,
        donorName: donorObj.anonymousDisplay ? "Anonymous" : donorObj.name,
        donor: donorObj,
        amount: d.amount,
        status: d.status,
        createdAt: d.createdAt,
        receiptUrl: d.receiptUrl,
        receiptNumber: d.receiptNumber,
      };
    });

    res.json(formattedDonations);
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

    const donation = await Donation.findById(id).select(
      "status donationHead amount receiptNumber",
    );

    if (!donation) {
      return res.status(404).json({ status: "NOT_FOUND" });
    }

    res.json({
      status: donation.status,
      donationHead: donation.donationHead,
      amount: donation.amount,
      receiptNumber: donation.receiptNumber,
    });
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

    // Determine expected receipt file path
    const expectedFileName = `receipt_${donation._id}.pdf`;
    const receiptPath = path.join(
      __dirname,
      "../../receipts",
      donation.receiptUrl ? path.basename(donation.receiptUrl) : expectedFileName,
    );

    // If receipt file doesn't exist, regenerate it on-the-fly
    if (!fs.existsSync(receiptPath)) {
      try {
        // Ensure donation has a receipt number
        if (!donation.receiptNumber) {
          donation.receiptNumber = `GRD-${new Date(donation.createdAt).getFullYear()}-${donation._id.toString().slice(-6).toUpperCase()}`;
        }

        const generatedPath = await generateDonationReceipt(donation);

        if (generatedPath && fs.existsSync(generatedPath)) {
          // Update donation record with new receipt URL
          donation.receiptUrl = `/receipts/${path.basename(generatedPath)}`;
          await donation.save();
        } else {
          return res.status(500).json({ message: "Failed to generate receipt" });
        }

        // Use the newly generated path
        const filename = `receipt-${donation.receiptNumber || donation._id}.pdf`;
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        const fileStream = fs.createReadStream(generatedPath);
        fileStream.pipe(res);
        return;
      } catch (genErr) {
        console.error("Receipt regeneration error:", genErr);
        return res.status(500).json({ message: "Failed to generate receipt" });
      }
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

/**
 * Get top collectors leaderboard
 * GET /donations/leaderboard
 * Returns top 5 collectors ranked by total donation amount
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 20); // Cap at 20
    const leaderboard = await getTopCollectors(limit);
    res.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ message: "Failed to fetch leaderboard" });
  }
};

/**
 * Get current user's collector stats
 * GET /donations/my-collector-stats
 * Requires authentication
 */
exports.getMyCollectorStats = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const stats = await getCollectorStats(req.user.id);
    if (!stats) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(stats);
  } catch (error) {
    console.error("Collector stats error:", error);
    res.status(500).json({ message: "Failed to fetch collector stats" });
  }
};
