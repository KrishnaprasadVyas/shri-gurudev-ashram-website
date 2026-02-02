const Activity = require("../models/Activity");
const imageService = require("../services/image.service");

/**
 * ACTIVITY CONTROLLER
 * Handles CRUD operations for activities and their subitems
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/activities
 * Get all visible activities with subitems
 */
exports.getVisibleActivities = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { isVisible: true };
    if (category) filter.category = category;

    const activities = await Activity.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    // Filter out hidden subitems
    const processedActivities = activities.map((activity) => ({
      ...activity,
      subitems: activity.subitems
        ? activity.subitems.filter((item) => item.isVisible !== false).sort((a, b) => a.order - b.order)
        : [],
    }));

    res.json({
      success: true,
      data: processedActivities,
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};

/**
 * GET /api/public/activities/:id
 * Get single activity by ID (public)
 */
exports.getActivityByIdPublic = async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      isVisible: true,
    })
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Filter hidden subitems
    activity.subitems = activity.subitems
      ? activity.subitems.filter((item) => item.isVisible !== false).sort((a, b) => a.order - b.order)
      : [];

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
};

/**
 * GET /api/public/activities/categories
 * Get list of activity categories
 */
exports.getActivityCategories = async (req, res) => {
  try {
    const categories = await Activity.distinct("category", { isVisible: true });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/activities
 * Get all activities (admin view, includes hidden)
 */
exports.getAllActivities = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, visibility } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (visibility === "visible") filter.isVisible = true;
    if (visibility === "hidden") filter.isVisible = false;

    const activities = await Activity.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await Activity.countDocuments(filter);

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activities",
    });
  }
};

/**
 * GET /api/admin/website/activities/:id
 * Get single activity by ID (admin)
 */
exports.getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activity",
    });
  }
};

/**
 * POST /api/admin/website/activities
 * Create new activity
 */
exports.createActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      iconKey,
      imageUrl,
      subitems,
      order,
      isVisible,
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Activity title is required",
      });
    }

    // Process subitems to ensure they have keys
    const processedSubitems = subitems
      ? subitems.map((item, index) => ({
          ...item,
          key:
            item.key ||
            item.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
          order: item.order !== undefined ? item.order : index,
        }))
      : [];

    const activity = new Activity({
      title: title.trim(),
      description: description?.trim() || "",
      category: category || "spiritual",
      iconKey: iconKey || "default",
      imageUrl: imageUrl || null,
      subitems: processedSubitems,
      order: order || 0,
      isVisible: isVisible !== false,
      createdBy: req.user.id,
    });

    await activity.save();

    res.status(201).json({
      success: true,
      message: "Activity created successfully",
      data: {
        _id: activity._id,
        title: activity.title,
      },
    });
  } catch (error) {
    console.error("Error creating activity:", error);

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
      message: "Failed to create activity",
    });
  }
};

/**
 * PUT /api/admin/website/activities/:id
 * Update activity
 */
exports.updateActivity = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      iconKey,
      imageUrl,
      subitems,
      order,
      isVisible,
    } = req.body;

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Update fields
    if (title !== undefined) activity.title = title.trim();
    if (description !== undefined) activity.description = description.trim();
    if (category !== undefined) activity.category = category;
    if (iconKey !== undefined) activity.iconKey = iconKey;
    if (imageUrl !== undefined) activity.imageUrl = imageUrl;
    if (order !== undefined) activity.order = order;
    if (isVisible !== undefined) activity.isVisible = isVisible;

    // Update subitems if provided
    if (subitems !== undefined) {
      activity.subitems = subitems.map((item, index) => ({
        ...item,
        key:
          item.key ||
          item.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        order: item.order !== undefined ? item.order : index,
      }));
    }

    activity.updatedBy = req.user.id;

    await activity.save();

    res.json({
      success: true,
      message: "Activity updated successfully",
      data: {
        _id: activity._id,
        title: activity.title,
      },
    });
  } catch (error) {
    console.error("Error updating activity:", error);

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
      message: "Failed to update activity",
    });
  }
};

/**
 * DELETE /api/admin/website/activities/:id
 * Delete activity
 */
exports.deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    res.json({
      success: true,
      message: "Activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete activity",
    });
  }
};

/**
 * PATCH /api/admin/website/activities/:id/toggle
 * Toggle activity visibility
 */
exports.toggleActivityVisibility = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    activity.isVisible = !activity.isVisible;
    activity.updatedBy = req.user.id;

    await activity.save();

    res.json({
      success: true,
      message: `Activity ${activity.isVisible ? "shown" : "hidden"} successfully`,
      data: { isVisible: activity.isVisible },
    });
  } catch (error) {
    console.error("Error toggling activity:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle activity visibility",
    });
  }
};

/**
 * PUT /api/admin/website/activities/reorder
 * Reorder activities
 */
exports.reorderActivities = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedIds array is required",
      });
    }

    // Update order for each activity
    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index, updatedBy: req.user.id },
      },
    }));

    await Activity.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Activities reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering activities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder activities",
    });
  }
};

// ==================== SUBITEM MANAGEMENT ====================

/**
 * POST /api/admin/website/activities/:id/subitems
 * Add subitem to activity
 */
exports.addSubitem = async (req, res) => {
  try {
    const { title, description, points, order, isVisible } = req.body;

    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Subitem title is required",
      });
    }

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const key = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const subitem = {
      key,
      title: title.trim(),
      description: description?.trim() || "",
      points: points || [],
      order: order !== undefined ? order : activity.subitems.length,
      isVisible: isVisible !== false,
    };

    activity.subitems.push(subitem);
    activity.updatedBy = req.user.id;

    await activity.save();

    res.status(201).json({
      success: true,
      message: "Subitem added successfully",
      data: {
        subitem,
        totalSubitems: activity.subitems.length,
      },
    });
  } catch (error) {
    console.error("Error adding subitem:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add subitem",
    });
  }
};

/**
 * PUT /api/admin/website/activities/:id/subitems/:subitemId
 * Update subitem
 */
exports.updateSubitem = async (req, res) => {
  try {
    const { title, description, points, order, isVisible } = req.body;

    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const subitem = activity.subitems.id(req.params.subitemId);

    if (!subitem) {
      return res.status(404).json({
        success: false,
        message: "Subitem not found",
      });
    }

    // Update subitem fields
    if (title !== undefined) {
      subitem.title = title.trim();
      subitem.key = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) subitem.description = description.trim();
    if (points !== undefined) subitem.points = points;
    if (order !== undefined) subitem.order = order;
    if (isVisible !== undefined) subitem.isVisible = isVisible;

    activity.updatedBy = req.user.id;

    await activity.save();

    res.json({
      success: true,
      message: "Subitem updated successfully",
      data: {
        _id: subitem._id,
        key: subitem.key,
        title: subitem.title,
        description: subitem.description,
        order: subitem.order,
        isVisible: subitem.isVisible,
      },
    });
  } catch (error) {
    console.error("Error updating subitem:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update subitem",
    });
  }
};

/**
 * DELETE /api/admin/website/activities/:id/subitems/:subitemId
 * Delete subitem
 */
exports.deleteSubitem = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    const subitem = activity.subitems.id(req.params.subitemId);

    if (!subitem) {
      return res.status(404).json({
        success: false,
        message: "Subitem not found",
      });
    }

    subitem.deleteOne();
    activity.updatedBy = req.user.id;

    await activity.save();

    res.json({
      success: true,
      message: "Subitem deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting subitem:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete subitem",
    });
  }
};

// ==================== IMAGE UPLOAD ====================

/**
 * POST /api/admin/website/activities/upload
 * Upload image for activity
 * Returns processed image URL
 */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await imageService.processAndSaveImage(
      req.file.buffer,
      req.file.originalname
    );

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        originalName: result.originalName,
      },
    });
  } catch (error) {
    console.error("Error uploading activity image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};
