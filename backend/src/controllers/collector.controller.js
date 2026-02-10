const User = require("../models/User");
const { saveKycDocument, deleteKycDocuments } = require("../services/kyc.service");
const { getCollectorDashboard } = require("../services/collector.service");
const { logCollectorApplication } = require("../services/audit.service");

/**
 * COLLECTOR CONTROLLER
 * Handles collector KYC application
 */

// PAN validation regex
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/**
 * Apply for collector role
 * POST /api/collector/apply
 * 
 * Requirements:
 * - User must be authenticated
 * - User role must be "USER"
 * - Cannot apply if already pending, approved, or has admin role
 */
exports.applyForCollector = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, address, panNumber } = req.body;

    // Validate required fields
    if (!fullName || !address || !panNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, address, and PAN number are required",
      });
    }

    // Validate full name (minimum 2 characters)
    if (fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters",
      });
    }

    // Validate address (minimum 10 characters)
    if (address.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 10 characters",
      });
    }

    // Validate PAN format
    const panUppercase = panNumber.toUpperCase().trim();
    if (!PAN_REGEX.test(panUppercase)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN format. Expected format: ABCDE1234F",
      });
    }

    // Validate uploaded files
    if (!req.files || !req.files.aadharFront || !req.files.aadharBack) {
      return res.status(400).json({
        success: false,
        message: "Both Aadhar front and back images are required",
      });
    }

    // Get user and validate current state
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user can apply
    if (user.role !== "USER") {
      // Check specific roles for appropriate message
      if (user.role === "COLLECTOR_PENDING") {
        return res.status(400).json({
          success: false,
          message: "Your collector application is already pending review",
        });
      }
      if (user.role === "COLLECTOR_APPROVED") {
        return res.status(400).json({
          success: false,
          message: "You are already an approved collector",
        });
      }
      if (user.role === "WEBSITE_ADMIN" || user.role === "SYSTEM_ADMIN") {
        return res.status(400).json({
          success: false,
          message: "Administrators cannot apply for collector role",
        });
      }
      return res.status(400).json({
        success: false,
        message: "You are not eligible to apply for collector role",
      });
    }

    // Check if there's already a pending application
    if (user.collectorProfile && user.collectorProfile.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "You already have a pending collector application",
      });
    }

    // Process and save Aadhar front image
    const aadharFrontFile = req.files.aadharFront[0];
    const aadharFrontResult = await saveKycDocument(aadharFrontFile.buffer, userId);

    // Process and save Aadhar back image
    const aadharBackFile = req.files.aadharBack[0];
    const aadharBackResult = await saveKycDocument(aadharBackFile.buffer, userId);

    const now = new Date();

    // Update user with collector profile
    user.role = "COLLECTOR_PENDING";
    user.collectorProfile = {
      fullName: fullName.trim(),
      address: address.trim(),
      panNumber: panUppercase,
      aadharFront: {
        fileKey: aadharFrontResult.fileKey,
        uploadedAt: now,
      },
      aadharBack: {
        fileKey: aadharBackResult.fileKey,
        uploadedAt: now,
      },
      status: "pending",
      submittedAt: now,
      approvedAt: null,
      rejectedReason: null,
    };

    await user.save();

    // Audit log: Collector application submitted
    logCollectorApplication(userId, fullName.trim(), req.ip);

    res.status(200).json({
      success: true,
      message: "Collector application submitted successfully. You will be notified once reviewed.",
    });
  } catch (error) {
    console.error("Collector application error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit collector application",
    });
  }
};

/**
 * Get current user's collector application status
 * GET /api/collector/status
 */
exports.getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("role collectorProfile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return status information (without file keys)
    const status = {
      role: user.role,
      collectorProfile: user.collectorProfile
        ? {
            fullName: user.collectorProfile.fullName,
            status: user.collectorProfile.status,
            submittedAt: user.collectorProfile.submittedAt,
            approvedAt: user.collectorProfile.approvedAt,
            rejectedReason: user.collectorProfile.rejectedReason,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get application status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get application status",
    });
  }
};

/**
 * Reapply after rejection
 * POST /api/collector/reapply
 * 
 * Allows rejected users to submit a new application
 * Deletes old KYC documents before saving new ones
 */
exports.reapplyForCollector = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fullName, address, panNumber } = req.body;

    // Validate required fields
    if (!fullName || !address || !panNumber) {
      return res.status(400).json({
        success: false,
        message: "Full name, address, and PAN number are required",
      });
    }

    // Validate full name
    if (fullName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Full name must be at least 2 characters",
      });
    }

    // Validate address
    if (address.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Address must be at least 10 characters",
      });
    }

    // Validate PAN format
    const panUppercase = panNumber.toUpperCase().trim();
    if (!PAN_REGEX.test(panUppercase)) {
      return res.status(400).json({
        success: false,
        message: "Invalid PAN format. Expected format: ABCDE1234F",
      });
    }

    // Validate uploaded files
    if (!req.files || !req.files.aadharFront || !req.files.aadharBack) {
      return res.status(400).json({
        success: false,
        message: "Both Aadhar front and back images are required",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Only users with rejected status can reapply
    if (user.role !== "USER" || !user.collectorProfile || user.collectorProfile.status !== "rejected") {
      return res.status(400).json({
        success: false,
        message: "You can only reapply after your previous application was rejected",
      });
    }

    // Delete old KYC documents
    const oldFileKeys = [];
    if (user.collectorProfile.aadharFront?.fileKey) {
      oldFileKeys.push(user.collectorProfile.aadharFront.fileKey);
    }
    if (user.collectorProfile.aadharBack?.fileKey) {
      oldFileKeys.push(user.collectorProfile.aadharBack.fileKey);
    }
    if (oldFileKeys.length > 0) {
      await deleteKycDocuments(oldFileKeys);
    }

    // Process and save new Aadhar front image
    const aadharFrontFile = req.files.aadharFront[0];
    const aadharFrontResult = await saveKycDocument(aadharFrontFile.buffer, userId);

    // Process and save new Aadhar back image
    const aadharBackFile = req.files.aadharBack[0];
    const aadharBackResult = await saveKycDocument(aadharBackFile.buffer, userId);

    const now = new Date();

    // Update user with new collector profile
    user.role = "COLLECTOR_PENDING";
    user.collectorProfile = {
      fullName: fullName.trim(),
      address: address.trim(),
      panNumber: panUppercase,
      aadharFront: {
        fileKey: aadharFrontResult.fileKey,
        uploadedAt: now,
      },
      aadharBack: {
        fileKey: aadharBackResult.fileKey,
        uploadedAt: now,
      },
      status: "pending",
      submittedAt: now,
      approvedAt: null,
      rejectedReason: null,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Collector application resubmitted successfully. You will be notified once reviewed.",
    });
  } catch (error) {
    console.error("Collector reapplication error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resubmit collector application",
    });
  }
};

/**
 * Get collector dashboard
 * GET /api/collector/dashboard
 * 
 * Requirements:
 * - User must be authenticated
 * - User role must be "COLLECTOR_APPROVED"
 * 
 * Returns:
 * - totalAmount: Total donation amount attributed to this collector
 * - donationCount: Number of donations attributed
 * - top5Collectors: Leaderboard of top 5 collectors
 * - recentDonations: Last 10 donations attributed to this collector
 */
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get dashboard data from service
    const dashboardData = await getCollectorDashboard(userId);

    if (!dashboardData) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
      });
    }

    // Get user's referral code
    const user = await User.findById(userId).select("referralCode fullName").lean();

    res.status(200).json({
      success: true,
      data: {
        referralCode: user?.referralCode || null,
        collectorName: user?.fullName || null,
        totalAmount: dashboardData.totalAmount,
        donationCount: dashboardData.donationCount,
        top5Collectors: dashboardData.top5Collectors,
        recentDonations: dashboardData.recentDonations,
      },
    });
  } catch (error) {
    console.error("Get collector dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard data",
    });
  }
};
