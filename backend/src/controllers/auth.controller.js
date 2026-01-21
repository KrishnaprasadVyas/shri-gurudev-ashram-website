const Otp = require("../models/Otp");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmailVerificationEmail } = require("../services/email.service");

exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpHash = await bcrypt.hash(otp.toString(), 10);

  await Otp.create({
    mobile,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  console.log("OTP:", otp); // Replace with WhatsApp/SMS later

  res.json({ message: "OTP sent" });
};

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP required" });
  }

  const record = await Otp.findOne({ mobile }).sort({ _id: -1 });
  if (!record) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteMany({ mobile });
    return res.status(400).json({ message: "OTP expired" });
  }

  const isValid = await bcrypt.compare(otp.toString(), record.otpHash);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  let user = await User.findOne({ mobile });
  if (!user) {
    user = await User.create({ mobile });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  await Otp.deleteMany({ mobile });

  // Store session cookie for all users
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ token });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified || false,
      mobile: user.mobile,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ==================== EMAIL VERIFICATION ==================== */

/**
 * Request email verification
 * POST /api/auth/request-email-verification
 * Requires JWT authentication
 *
 * Flow:
 * 1. Validate email format
 * 2. Generate secure random token
 * 3. Hash token and store with 15-min expiry
 * 4. Send verification email with link
 */
exports.requestEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const userId = req.user.id;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ message: "Valid email address required" });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      // Generic response to prevent user enumeration
      return res.status(400).json({ message: "Unable to process request" });
    }

    // If email is already verified with same address, no need to re-verify
    if (user.email === email && user.emailVerified) {
      return res.status(200).json({
        message: "Email already verified",
        alreadyVerified: true,
      });
    }

    // Generate secure random token (32 bytes = 64 hex chars)
    const rawToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing (using SHA-256)
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // Set expiry to 15 minutes from now
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    // Update user with email and verification token
    user.email = email;
    user.emailVerified = false;
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = expiry;
    await user.save();

    // Send verification email with raw token (link contains unhashed token)
    const emailSent = await sendEmailVerificationEmail(email, rawToken);

    if (!emailSent) {
      return res
        .status(500)
        .json({ message: "Failed to send verification email" });
    }

    res.json({
      message: "Verification email sent",
      email: email,
    });
  } catch (error) {
    console.error("Email verification request error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Verify email with token
 * GET /api/auth/verify-email?token=...
 * Public endpoint (no JWT required)
 *
 * Flow:
 * 1. Hash incoming token
 * 2. Find user by hashed token + check expiry
 * 3. Mark email verified, clear token fields
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token required" });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find user with matching token and valid expiry
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpiry: { $gt: new Date() }, // Token not expired
    });

    if (!user) {
      // Generic error - don't reveal if token existed or expired
      return res.status(400).json({
        message: "Invalid or expired verification link",
        expired: true,
      });
    }

    // Mark email as verified and clear token fields (one-time use)
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({
      message: "Email verified successfully",
      email: user.email,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Check email verification status
 * GET /api/auth/email-status
 * Requires JWT authentication
 */
exports.getEmailStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("email emailVerified");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      email: user.email || null,
      emailVerified: user.emailVerified || false,
    });
  } catch (error) {
    console.error("Email status check error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
