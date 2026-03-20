const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { sendEmailVerificationEmail } = require("../services/email.service");
const { assignReferralCode } = require("../services/collector.service");
const admin = require("../config/firebaseAdmin");

/**
 * Verify Firebase ID token and login/register user
 * POST /api/auth/verify-firebase-token
 *
 * Flow:
 * 1. Validate Firebase ID token
 * 2. Extract phone number from decoded token
 * 3. Find or create user in MongoDB
 * 4. Issue backend JWT session token
 */
exports.verifyFirebaseToken = async (req, res) => {
  try {
    const { token } = req.body;

    // Validate token exists
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
    }

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (firebaseError) {
      console.error("[Auth] Firebase token verification failed:", firebaseError.code);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Firebase token",
      });
    }

    // Extract phone number from decoded token
    const phoneNumber = decodedToken.phone_number;
    if (!phoneNumber) {
      console.error("[Auth] Firebase token missing phone_number claim");
      return res.status(400).json({
        success: false,
        message: "Phone number not found in token",
      });
    }

    // Normalize phone number: extract 10-digit number for storage
    // Firebase returns format like "+919876543210"
    let mobile = phoneNumber.replace(/[^\d]/g, "");
    if (mobile.startsWith("91") && mobile.length === 12) {
      mobile = mobile.slice(2); // Store as 10-digit
    }

    // Find or create user
    let user = await User.findOne({ mobile });
    let isNewUser = false;

    if (!user) {
      user = await User.create({ mobile });
      isNewUser = true;
      console.log(`[Auth] New user created: ${mobile}`);
    } else {
      console.log(`[Auth] Existing user logged in: ${mobile}`);
    }

    // Assign referral code for new users (async, non-blocking)
    if (isNewUser || !user.referralCode) {
      assignReferralCode(user._id).catch((err) => {
        console.error("[Auth] Failed to assign referral code:", err);
      });
    }

    // Generate backend JWT session token
    const jwtToken = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set HTTP-only cookie for additional security
    res.cookie("authToken", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return success response
    res.json({
      success: true,
      token: jwtToken,
      user: {
        id: user._id,
        mobile: user.mobile,
        fullName: user.fullName || null,
        email: user.email || null,
        role: user.role,
        referralCode: user.referralCode || null,
      },
    });
  } catch (error) {
    console.error("[Auth] verifyFirebaseToken error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Build collector profile response (hide file keys)
    let collectorProfileResponse = null;
    if (user.collectorProfile && user.collectorProfile.status !== "none") {
      collectorProfileResponse = {
        fullName: user.collectorProfile.fullName,
        status: user.collectorProfile.status,
        submittedAt: user.collectorProfile.submittedAt,
        approvedAt: user.collectorProfile.approvedAt,
        rejectedReason: user.collectorProfile.rejectedReason,
      };
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      emailVerified: user.emailVerified || false,
      mobile: user.mobile,
      role: user.role,
      referralCode: user.referralCode || null,
      collectorProfile: collectorProfileResponse,
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
