const DonationHead = require("../models/DonationHead");
const Donation = require("../models/Donation");

/**
 * DONATION HEAD CONTROLLER
 * Handles CRUD operations for donation causes/heads
 *
 * IMPORTANT: This replaces the hardcoded donationHeads in frontend
 * The 'name' field is used as the identifier in Donation records
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/donation-heads
 * Get active donation heads for donation form
 */
exports.getActiveDonationHeads = async (req, res) => {
  try {
    const donationHeads = await DonationHead.find({ isActive: true })
      .sort({ order: 1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    res.json({
      success: true,
      data: donationHeads,
    });
  } catch (error) {
    console.error("Error fetching donation heads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation causes",
    });
  }
};

/**
 * GET /api/public/donation-heads/featured
 * Get featured donation heads for homepage
 */
exports.getFeaturedDonationHeads = async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    const donationHeads = await DonationHead.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ order: 1 })
      .limit(parseInt(limit))
      .select("key name description imageUrl iconKey minAmount goalAmount currentAmount")
      .lean();

    res.json({
      success: true,
      data: donationHeads,
    });
  } catch (error) {
    console.error("Error fetching featured donation heads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured causes",
    });
  }
};

/**
 * GET /api/public/donation-heads/:key
 * Get single donation head by key (for cause detail page)
 */
exports.getDonationHeadByKey = async (req, res) => {
  try {
    const donationHead = await DonationHead.findOne({
      key: req.params.key.toLowerCase(),
      isActive: true,
    })
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation cause not found",
      });
    }

    res.json({
      success: true,
      data: donationHead,
    });
  } catch (error) {
    console.error("Error fetching donation head:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation cause",
    });
  }
};

/**
 * GET /api/public/donation-heads/:key/stats
 * Get donation statistics for a cause
 */
exports.getDonationHeadStats = async (req, res) => {
  try {
    const donationHead = await DonationHead.findOne({
      key: req.params.key.toLowerCase(),
      isActive: true,
    }).lean();

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation cause not found",
      });
    }

    // Get donation stats from Donation collection
    const stats = await Donation.aggregate([
      {
        $match: {
          "donationHead.name": donationHead.name,
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          donorCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        name: donationHead.name,
        goalAmount: donationHead.goalAmount,
        currentAmount: stats[0]?.totalAmount || 0,
        donorCount: stats[0]?.donorCount || 0,
        percentageReached: donationHead.goalAmount
          ? Math.min(100, Math.round(((stats[0]?.totalAmount || 0) / donationHead.goalAmount) * 100))
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching donation head stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation statistics",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/donation-heads
 * Get all donation heads (admin view)
 */
exports.getAllDonationHeads = async (req, res) => {
  try {
    const { page = 1, limit = 50, active } = req.query;

    const filter = {};
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;

    const donationHeads = await DonationHead.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await DonationHead.countDocuments(filter);

    // Get donation counts for each head
    const headNames = donationHeads.map((h) => h.name);
    const donationCounts = await Donation.aggregate([
      {
        $match: {
          "donationHead.name": { $in: headNames },
          status: "SUCCESS",
        },
      },
      {
        $group: {
          _id: "$donationHead.name",
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        },
      },
    ]);

    // Merge counts with donation heads
    const countsMap = donationCounts.reduce((acc, c) => {
      acc[c._id] = { count: c.count, total: c.total };
      return acc;
    }, {});

    const enrichedHeads = donationHeads.map((head) => ({
      ...head,
      donationCount: countsMap[head.name]?.count || 0,
      totalDonated: countsMap[head.name]?.total || 0,
    }));

    res.json({
      success: true,
      data: enrichedHeads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching donation heads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation heads",
    });
  }
};

/**
 * GET /api/admin/website/donation-heads/:id
 * Get single donation head by ID (admin)
 */
exports.getDonationHeadById = async (req, res) => {
  try {
    const donationHead = await DonationHead.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    res.json({
      success: true,
      data: donationHead,
    });
  } catch (error) {
    console.error("Error fetching donation head:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch donation head",
    });
  }
};

/**
 * POST /api/admin/website/donation-heads
 * Create new donation head
 */
exports.createDonationHead = async (req, res) => {
  try {
    const {
      key,
      name,
      description,
      longDescription,
      imageUrl,
      iconKey,
      minAmount,
      presetAmounts,
      subCauses,
      order,
      isActive,
      isFeatured,
      is80GEligible,
      goalAmount,
    } = req.body;

    // Validation
    if (!key || key.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Donation head key is required",
      });
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Donation head name is required",
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    // Check for duplicate key
    const existing = await DonationHead.findOne({ key: key.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Donation head with this key already exists",
      });
    }

    // Process sub-causes
    const processedSubCauses = subCauses
      ? subCauses.map((sc) => ({
          ...sc,
          key:
            sc.key ||
            sc.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
        }))
      : [];

    const donationHead = new DonationHead({
      key: key.toLowerCase().trim(),
      name: name.trim(),
      description: description.trim(),
      longDescription: longDescription?.trim() || "",
      imageUrl: imageUrl || null,
      iconKey: iconKey || "general",
      minAmount: minAmount || null,
      presetAmounts: presetAmounts || [100, 500, 1000, 2500, 5000, 10000],
      subCauses: processedSubCauses,
      order: order || 0,
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      is80GEligible: is80GEligible !== false,
      goalAmount: goalAmount || null,
      createdBy: req.user.id,
    });

    await donationHead.save();

    res.status(201).json({
      success: true,
      message: "Donation head created successfully",
      data: donationHead,
    });
  } catch (error) {
    console.error("Error creating donation head:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Donation head with this key already exists",
      });
    }

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
      message: "Failed to create donation head",
    });
  }
};

/**
 * PUT /api/admin/website/donation-heads/:id
 * Update donation head
 */
exports.updateDonationHead = async (req, res) => {
  try {
    const {
      name,
      description,
      longDescription,
      imageUrl,
      iconKey,
      minAmount,
      presetAmounts,
      subCauses,
      order,
      isActive,
      isFeatured,
      is80GEligible,
      goalAmount,
    } = req.body;

    const donationHead = await DonationHead.findById(req.params.id);

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    // Note: We don't allow changing 'key' as it may be referenced in existing donations

    // Update fields
    if (name !== undefined) donationHead.name = name.trim();
    if (description !== undefined) donationHead.description = description.trim();
    if (longDescription !== undefined) donationHead.longDescription = longDescription.trim();
    if (imageUrl !== undefined) donationHead.imageUrl = imageUrl;
    if (iconKey !== undefined) donationHead.iconKey = iconKey;
    if (minAmount !== undefined) donationHead.minAmount = minAmount;
    if (presetAmounts !== undefined) donationHead.presetAmounts = presetAmounts;
    if (order !== undefined) donationHead.order = order;
    if (isActive !== undefined) donationHead.isActive = isActive;
    if (isFeatured !== undefined) donationHead.isFeatured = isFeatured;
    if (is80GEligible !== undefined) donationHead.is80GEligible = is80GEligible;
    if (goalAmount !== undefined) donationHead.goalAmount = goalAmount;

    // Update sub-causes if provided
    if (subCauses !== undefined) {
      donationHead.subCauses = subCauses.map((sc) => ({
        ...sc,
        key:
          sc.key ||
          sc.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
      }));
    }

    donationHead.updatedBy = req.user.id;

    await donationHead.save();

    res.json({
      success: true,
      message: "Donation head updated successfully",
      data: donationHead,
    });
  } catch (error) {
    console.error("Error updating donation head:", error);

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
      message: "Failed to update donation head",
    });
  }
};

/**
 * DELETE /api/admin/website/donation-heads/:id
 * Delete donation head (soft delete by deactivating)
 */
exports.deleteDonationHead = async (req, res) => {
  try {
    const { force } = req.query;

    const donationHead = await DonationHead.findById(req.params.id);

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    // Check if there are donations using this head
    const donationCount = await Donation.countDocuments({
      "donationHead.name": donationHead.name,
    });

    if (donationCount > 0 && force !== "true") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${donationCount} donations exist for this cause. Use force=true to deactivate instead.`,
        donationCount,
      });
    }

    if (donationCount > 0 && force === "true") {
      // Soft delete - just deactivate
      donationHead.isActive = false;
      donationHead.updatedBy = req.user.id;
      await donationHead.save();

      return res.json({
        success: true,
        message: "Donation head deactivated (not deleted due to existing donations)",
        deactivated: true,
      });
    }

    // Hard delete
    await donationHead.deleteOne();

    res.json({
      success: true,
      message: "Donation head deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting donation head:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete donation head",
    });
  }
};

/**
 * PATCH /api/admin/website/donation-heads/:id/toggle
 * Toggle donation head active status
 */
exports.toggleDonationHeadStatus = async (req, res) => {
  try {
    const donationHead = await DonationHead.findById(req.params.id);

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    donationHead.isActive = !donationHead.isActive;
    donationHead.updatedBy = req.user.id;

    await donationHead.save();

    res.json({
      success: true,
      message: `Donation head ${donationHead.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: donationHead.isActive },
    });
  } catch (error) {
    console.error("Error toggling donation head:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle donation head status",
    });
  }
};

/**
 * PUT /api/admin/website/donation-heads/reorder
 * Reorder donation heads
 */
exports.reorderDonationHeads = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedIds array is required",
      });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index, updatedBy: req.user.id },
      },
    }));

    await DonationHead.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Donation heads reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering donation heads:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder donation heads",
    });
  }
};

/**
 * POST /api/admin/website/donation-heads/:id/sub-causes
 * Add sub-cause to donation head
 */
exports.addSubCause = async (req, res) => {
  try {
    const { name, description, minAmount, isActive } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Sub-cause name is required",
      });
    }

    const donationHead = await DonationHead.findById(req.params.id);

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    const key = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate key
    if (donationHead.subCauses.some((sc) => sc.key === key)) {
      return res.status(400).json({
        success: false,
        message: "Sub-cause with this name already exists",
      });
    }

    donationHead.subCauses.push({
      key,
      name: name.trim(),
      description: description?.trim() || "",
      minAmount: minAmount || null,
      isActive: isActive !== false,
    });

    donationHead.updatedBy = req.user.id;

    await donationHead.save();

    res.status(201).json({
      success: true,
      message: "Sub-cause added successfully",
      data: donationHead,
    });
  } catch (error) {
    console.error("Error adding sub-cause:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add sub-cause",
    });
  }
};

/**
 * DELETE /api/admin/website/donation-heads/:id/sub-causes/:subCauseId
 * Delete sub-cause from donation head
 */
exports.deleteSubCause = async (req, res) => {
  try {
    const donationHead = await DonationHead.findById(req.params.id);

    if (!donationHead) {
      return res.status(404).json({
        success: false,
        message: "Donation head not found",
      });
    }

    const subCause = donationHead.subCauses.id(req.params.subCauseId);

    if (!subCause) {
      return res.status(404).json({
        success: false,
        message: "Sub-cause not found",
      });
    }

    subCause.deleteOne();
    donationHead.updatedBy = req.user.id;

    await donationHead.save();

    res.json({
      success: true,
      message: "Sub-cause deleted successfully",
      data: donationHead,
    });
  } catch (error) {
    console.error("Error deleting sub-cause:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete sub-cause",
    });
  }
};
