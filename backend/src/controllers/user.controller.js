const User = require("../models/User");
const { assignReferralCode } = require("../services/collector.service");

/**
 * Update user profile
 * PUT /api/user/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, email, address, whatsapp } = req.body;

    const updateData = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        whatsapp: user.whatsapp,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get user profile
 * GET /api/user/profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      whatsapp: user.whatsapp,
      role: user.role,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Generate referral code for current user (if missing)
 * POST /api/user/generate-referral-code
 * 
 * BUG FIX: Allows users to request referral code generation on-demand
 * This fixes the issue where Collector Dashboard shows "generating..." indefinitely
 * for existing users who don't have a referral code yet.
 * 
 * VALIDATION: Requires fullName to be set before generating referral code
 */
exports.generateReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("referralCode fullName");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If user already has a referral code, return it
    if (user.referralCode) {
      return res.json({
        referralCode: user.referralCode,
        message: "Referral code already exists",
      });
    }

    // VALIDATION: Require fullName before generating referral code
    if (!user.fullName || !user.fullName.trim()) {
      return res.status(400).json({ 
        message: "Please update your profile with your full name before generating a referral code",
        requiresName: true 
      });
    }

    // Generate new referral code
    const referralCode = await assignReferralCode(req.user.id);

    if (!referralCode) {
      return res.status(500).json({ message: "Failed to generate referral code" });
    }

    console.log(`[USER] Referral code generated on-demand for user ${req.user.id}: ${referralCode}`);

    res.json({
      referralCode,
      message: "Referral code generated successfully",
    });
  } catch (error) {
    console.error("Generate referral code error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
