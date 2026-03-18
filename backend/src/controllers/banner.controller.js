const Banner = require("../models/Banner");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

/**
 * BANNER CONTROLLER
 * Handles CRUD operations for homepage hero slider banners
 * Images are processed with Sharp and stored in /uploads/banners/
 */

// Upload directory for banner images
const BANNER_UPLOAD_DIR = path.join(__dirname, "../../uploads/banners");

// Ensure directory exists
const ensureBannerDir = () => {
  if (!fs.existsSync(BANNER_UPLOAD_DIR)) {
    fs.mkdirSync(BANNER_UPLOAD_DIR, { recursive: true });
  }
};

// Initialize on module load
ensureBannerDir();

// Max active banners allowed
const MAX_ACTIVE_BANNERS = 5;

const parseMultilingualField = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value === "object") {
    return {
      en: value.en?.toString().trim() || "",
      hi: value.hi?.toString().trim() || "",
      mr: value.mr?.toString().trim() || "",
    };
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return { en: "", hi: "", mr: "" };
    }

    try {
      const parsed = JSON.parse(trimmedValue);
      if (parsed && typeof parsed === "object") {
        return {
          en: parsed.en?.toString().trim() || "",
          hi: parsed.hi?.toString().trim() || "",
          mr: parsed.mr?.toString().trim() || "",
        };
      }
    } catch (_error) {
      // Fallback below for plain string values
    }

    return { en: trimmedValue, hi: "", mr: "" };
  }

  return { en: String(value).trim(), hi: "", mr: "" };
};

/**
 * Process and save banner image
 * Resizes to max 1920px width, converts to WebP
 */
const processAndSaveBannerImage = async (buffer) => {
  ensureBannerDir();

  const uniqueId = uuidv4();
  const filename = `${uniqueId}.webp`;
  const fullPath = path.join(BANNER_UPLOAD_DIR, filename);

  await sharp(buffer)
    .resize(1920, null, {
      withoutEnlargement: true,
      fit: "inside",
    })
    .webp({ quality: 85 })
    .toFile(fullPath);

  return `/uploads/banners/${filename}`;
};

/**
 * Delete banner image from filesystem
 */
const deleteBannerImage = (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.startsWith("/uploads/banners/")) {
      return false;
    }

    const filename = path.basename(imageUrl);
    const fullPath = path.join(BANNER_UPLOAD_DIR, filename);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }

    return true;
  } catch (error) {
    console.error("Banner image deletion error:", error.message);
    return false;
  }
};

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/banners
 * Get active banners sorted by order (max 5)
 */
exports.getActiveBanners = async (req, res) => {
  try {
    const banners = await Banner.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .limit(MAX_ACTIVE_BANNERS)
      .select("-createdBy -updatedBy -__v")
      .lean();

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/banners
 * Get all banners (admin view, includes inactive)
 */
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.find()
      .sort({ order: 1, createdAt: -1 })
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error("Error fetching banners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banners",
    });
  }
};

/**
 * GET /api/admin/website/banners/:id
 * Get single banner by ID
 */
exports.getBannerById = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    res.json({
      success: true,
      data: banner,
    });
  } catch (error) {
    console.error("Error fetching banner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch banner",
    });
  }
};

/**
 * POST /api/admin/website/banners
 * Create new banner (multipart/form-data with image)
 */
exports.createBanner = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Banner image is required",
      });
    }

    const { title, subtitle, description, ctaText, ctaLink, isActive, order } =
      req.body;

    const parsedTitle = parseMultilingualField(title);
    const parsedSubtitle = parseMultilingualField(subtitle);
    const parsedDescription = parseMultilingualField(description);
    const parsedCtaText = parseMultilingualField(ctaText);

    if (!parsedTitle?.en) {
      return res.status(400).json({
        success: false,
        message: "Banner title is required",
      });
    }

    // Check active banner limit if creating as active
    const shouldBeActive = isActive !== "false";
    if (shouldBeActive) {
      const activeCount = await Banner.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE_BANNERS) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_ACTIVE_BANNERS} active banners allowed. Deactivate one first.`,
        });
      }
    }

    // Process and save image
    const imageUrl = await processAndSaveBannerImage(req.file.buffer);

    const banner = new Banner({
      title: parsedTitle,
      subtitle: parsedSubtitle || { en: "", hi: "", mr: "" },
      description: parsedDescription || { en: "", hi: "", mr: "" },
      image: imageUrl,
      ctaText: parsedCtaText || { en: "", hi: "", mr: "" },
      ctaLink: ctaLink?.trim() || "",
      isActive: shouldBeActive,
      order: parseInt(order) || 0,
      createdBy: req.user.id,
    });

    await banner.save();

    res.status(201).json({
      success: true,
      message: "Banner created successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error creating banner:", error);

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
      message: "Failed to create banner",
    });
  }
};

/**
 * PUT /api/admin/website/banners/:id
 * Update banner (multipart/form-data, image optional)
 */
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    const { title, subtitle, description, ctaText, ctaLink, isActive, order } =
      req.body;

    // Check active banner limit if activating
    const willBeActive =
      isActive !== undefined ? isActive !== "false" : banner.isActive;
    if (willBeActive && !banner.isActive) {
      const activeCount = await Banner.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE_BANNERS) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_ACTIVE_BANNERS} active banners allowed. Deactivate one first.`,
        });
      }
    }

    // If new image uploaded, process it and delete old one
    if (req.file) {
      const newImageUrl = await processAndSaveBannerImage(req.file.buffer);
      deleteBannerImage(banner.image);
      banner.image = newImageUrl;
    }

    // Update text fields
    if (title !== undefined) {
      const parsedTitle = parseMultilingualField(title);
      if (!parsedTitle?.en) {
        return res.status(400).json({
          success: false,
          message: "Banner title is required",
        });
      }
      banner.title = parsedTitle;
    }
    if (subtitle !== undefined) {
      banner.subtitle = parseMultilingualField(subtitle) || {
        en: "",
        hi: "",
        mr: "",
      };
    }
    if (description !== undefined) {
      banner.description = parseMultilingualField(description) || {
        en: "",
        hi: "",
        mr: "",
      };
    }
    if (ctaText !== undefined) {
      banner.ctaText = parseMultilingualField(ctaText) || {
        en: "",
        hi: "",
        mr: "",
      };
    }
    if (ctaLink !== undefined) banner.ctaLink = ctaLink.trim();
    if (isActive !== undefined) banner.isActive = isActive !== "false";
    if (order !== undefined) banner.order = parseInt(order) || 0;

    banner.updatedBy = req.user.id;

    await banner.save();

    res.json({
      success: true,
      message: "Banner updated successfully",
      data: banner,
    });
  } catch (error) {
    console.error("Error updating banner:", error);

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
      message: "Failed to update banner",
    });
  }
};

/**
 * DELETE /api/admin/website/banners/:id
 * Delete banner and its image file
 */
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Delete image file
    deleteBannerImage(banner.image);

    // Delete document
    await Banner.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete banner",
    });
  }
};

/**
 * PATCH /api/admin/website/banners/:id/toggle
 * Toggle banner active status
 */
exports.toggleBannerStatus = async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Banner not found",
      });
    }

    // Check active limit if activating
    if (!banner.isActive) {
      const activeCount = await Banner.countDocuments({ isActive: true });
      if (activeCount >= MAX_ACTIVE_BANNERS) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${MAX_ACTIVE_BANNERS} active banners allowed. Deactivate one first.`,
        });
      }
    }

    banner.isActive = !banner.isActive;
    banner.updatedBy = req.user.id;

    await banner.save();

    res.json({
      success: true,
      message: `Banner ${banner.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: banner.isActive },
    });
  } catch (error) {
    console.error("Error toggling banner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle banner status",
    });
  }
};

/**
 * PUT /api/admin/website/banners/reorder
 * Reorder banners
 */
exports.reorderBanners = async (req, res) => {
  try {
    const { bannerIds } = req.body;

    if (!Array.isArray(bannerIds) || bannerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "bannerIds array is required",
      });
    }

    // Update order for each banner
    const updates = bannerIds.map((id, index) =>
      Banner.findByIdAndUpdate(id, { order: index, updatedBy: req.user.id }),
    );

    await Promise.all(updates);

    res.json({
      success: true,
      message: "Banners reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering banners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder banners",
    });
  }
};
