const Announcement = require("../models/Announcement");

/**
 * ANNOUNCEMENT CONTROLLER
 * Handles CRUD operations for announcements
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/announcements
 * Get all active announcements (date-filtered)
 */
exports.getActiveAnnouncements = async (req, res) => {
  try {
    const now = new Date();

    const announcements = await Announcement.find({
      isActive: true,
      $or: [{ startDate: null }, { startDate: { $lte: now } }],
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
    })
      .sort({ priority: -1, createdAt: -1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    // Filter using virtual-like logic since lean() doesn't include virtuals
    const activeAnnouncements = announcements.filter((ann) => {
      if (ann.startDate && now < new Date(ann.startDate)) return false;
      if (ann.endDate && now > new Date(ann.endDate)) return false;
      return true;
    });

    res.json({
      success: true,
      data: activeAnnouncements,
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/announcements
 * Get all announcements (admin view, includes inactive)
 */
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, type } = req.query;

    const filter = {};
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;
    if (type) filter.type = type;

    const announcements = await Announcement.find(filter)
      .sort({ priority: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await Announcement.countDocuments(filter);

    res.json({
      success: true,
      data: announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
    });
  }
};

/**
 * GET /api/admin/website/announcements/:id
 * Get single announcement by ID
 */
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Error fetching announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcement",
    });
  }
};

/**
 * POST /api/admin/website/announcements
 * Create new announcement
 */
exports.createAnnouncement = async (req, res) => {
  try {
    const { text, type, isActive, priority, startDate, endDate, linkUrl, linkText } =
      req.body;

    // Validation
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Announcement text is required",
      });
    }

    // Validate date range
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    const announcement = new Announcement({
      text: text.trim(),
      type: type || "info",
      isActive: isActive !== false,
      priority: priority || 0,
      startDate: startDate || null,
      endDate: endDate || null,
      linkUrl: linkUrl || null,
      linkText: linkText || null,
      createdBy: req.user.id,
    });

    await announcement.save();

    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Error creating announcement:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

/**
 * PUT /api/admin/website/announcements/:id
 * Update announcement
 */
exports.updateAnnouncement = async (req, res) => {
  try {
    const { text, type, isActive, priority, startDate, endDate, linkUrl, linkText } =
      req.body;

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Validate date range
    const newStartDate = startDate !== undefined ? startDate : announcement.startDate;
    const newEndDate = endDate !== undefined ? endDate : announcement.endDate;

    if (
      newStartDate &&
      newEndDate &&
      new Date(newStartDate) > new Date(newEndDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    // Update fields
    if (text !== undefined) announcement.text = text.trim();
    if (type !== undefined) announcement.type = type;
    if (isActive !== undefined) announcement.isActive = isActive;
    if (priority !== undefined) announcement.priority = priority;
    if (startDate !== undefined) announcement.startDate = startDate;
    if (endDate !== undefined) announcement.endDate = endDate;
    if (linkUrl !== undefined) announcement.linkUrl = linkUrl;
    if (linkText !== undefined) announcement.linkText = linkText;

    announcement.updatedBy = req.user.id;

    await announcement.save();

    res.json({
      success: true,
      message: "Announcement updated successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Error updating announcement:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
    });
  }
};

/**
 * DELETE /api/admin/website/announcements/:id
 * Delete announcement
 */
exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    res.json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
    });
  }
};

/**
 * PATCH /api/admin/website/announcements/:id/toggle
 * Toggle announcement active status
 */
exports.toggleAnnouncementStatus = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isActive = !announcement.isActive;
    announcement.updatedBy = req.user.id;

    await announcement.save();

    res.json({
      success: true,
      message: `Announcement ${announcement.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: announcement.isActive },
    });
  } catch (error) {
    console.error("Error toggling announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle announcement status",
    });
  }
};
