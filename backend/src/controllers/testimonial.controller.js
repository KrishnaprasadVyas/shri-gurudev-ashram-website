const Testimonial = require("../models/Testimonial");

/**
 * TESTIMONIAL CONTROLLER
 * Handles CRUD operations for testimonials with moderation
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/testimonials
 * Get approved testimonials
 */
exports.getApprovedTestimonials = async (req, res) => {
  try {
    const { limit = 10, featured } = req.query;

    const filter = { isApproved: true };
    if (featured === "true") filter.isFeatured = true;

    const testimonials = await Testimonial.find(filter)
      .sort({ isFeatured: -1, order: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .select("name city message rating avatarUrl")
      .lean();

    res.json({
      success: true,
      data: testimonials,
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
    });
  }
};

/**
 * POST /api/public/testimonials
 * Submit new testimonial (requires approval)
 */
exports.submitTestimonial = async (req, res) => {
  try {
    const { name, city, email, message, rating } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (message.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: "Message must be at least 20 characters",
      });
    }

    const testimonial = new Testimonial({
      name: name.trim(),
      city: city?.trim() || "",
      email: email?.trim().toLowerCase() || null,
      message: message.trim(),
      rating: rating || 5,
      isApproved: false, // Requires admin approval
      user: req.user?.id || null, // Link to user if authenticated
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message:
        "Testimonial submitted successfully. It will be visible after approval.",
    });
  } catch (error) {
    console.error("Error submitting testimonial:", error);

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
      message: "Failed to submit testimonial",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/testimonials
 * Get all testimonials (admin view)
 */
exports.getAllTestimonials = async (req, res) => {
  try {
    const { page = 1, limit = 20, approved, featured } = req.query;

    const filter = {};
    if (approved === "true") filter.isApproved = true;
    if (approved === "false") filter.isApproved = false;
    if (featured === "true") filter.isFeatured = true;

    const testimonials = await Testimonial.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "fullName mobile")
      .populate("approvedBy", "fullName")
      .lean();

    const total = await Testimonial.countDocuments(filter);
    const pendingCount = await Testimonial.countDocuments({
      isApproved: false,
    });

    res.json({
      success: true,
      data: testimonials,
      pendingCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonials",
    });
  }
};

/**
 * GET /api/admin/website/testimonials/pending
 * Get pending testimonials for moderation
 */
exports.getPendingTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isApproved: false })
      .sort({ createdAt: -1 })
      .populate("user", "fullName mobile")
      .lean();

    res.json({
      success: true,
      data: testimonials,
      count: testimonials.length,
    });
  } catch (error) {
    console.error("Error fetching pending testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending testimonials",
    });
  }
};

/**
 * GET /api/admin/website/testimonials/:id
 * Get single testimonial by ID
 */
exports.getTestimonialById = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id)
      .populate("user", "fullName mobile email")
      .populate("approvedBy", "fullName");

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    res.json({
      success: true,
      data: testimonial,
    });
  } catch (error) {
    console.error("Error fetching testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch testimonial",
    });
  }
};

/**
 * POST /api/admin/website/testimonials
 * Create testimonial directly (pre-approved)
 */
exports.createTestimonial = async (req, res) => {
  try {
    const {
      name,
      city,
      email,
      message,
      rating,
      isApproved,
      isFeatured,
      order,
      avatarUrl,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const testimonial = new Testimonial({
      name: name.trim(),
      city: city?.trim() || "",
      email: email?.trim().toLowerCase() || null,
      message: message.trim(),
      rating: rating || 5,
      isApproved: isApproved !== false, // Default to approved when admin creates
      isFeatured: isFeatured === true,
      order: order || 0,
      avatarUrl: avatarUrl || null,
      approvedBy: isApproved !== false ? req.user.id : null,
      approvedAt: isApproved !== false ? new Date() : null,
    });

    await testimonial.save();

    res.status(201).json({
      success: true,
      message: "Testimonial created successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error creating testimonial:", error);

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
      message: "Failed to create testimonial",
    });
  }
};

/**
 * PUT /api/admin/website/testimonials/:id
 * Update testimonial
 */
exports.updateTestimonial = async (req, res) => {
  try {
    const { name, city, email, message, rating, isFeatured, order, avatarUrl } =
      req.body;

    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    // Update fields
    if (name !== undefined) testimonial.name = name.trim();
    if (city !== undefined) testimonial.city = city.trim();
    if (email !== undefined)
      testimonial.email = email?.trim().toLowerCase() || null;
    if (message !== undefined) testimonial.message = message.trim();
    if (rating !== undefined) testimonial.rating = rating;
    if (isFeatured !== undefined) testimonial.isFeatured = isFeatured;
    if (order !== undefined) testimonial.order = order;
    if (avatarUrl !== undefined) testimonial.avatarUrl = avatarUrl;

    await testimonial.save();

    res.json({
      success: true,
      message: "Testimonial updated successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error updating testimonial:", error);

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
      message: "Failed to update testimonial",
    });
  }
};

/**
 * DELETE /api/admin/website/testimonials/:id
 * Delete testimonial
 */
exports.deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    res.json({
      success: true,
      message: "Testimonial deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete testimonial",
    });
  }
};

/**
 * PATCH /api/admin/website/testimonials/:id/toggle
 * Toggle approval status
 */
exports.toggleTestimonialApproval = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    testimonial.isApproved = !testimonial.isApproved;

    // Update approval metadata
    if (testimonial.isApproved) {
      testimonial.approvedBy = req.user.id;
      testimonial.approvedAt = new Date();
    } else {
      testimonial.approvedBy = null;
      testimonial.approvedAt = null;
    }

    await testimonial.save();

    res.json({
      success: true,
      message: `Testimonial ${testimonial.isApproved ? "approved" : "unapproved"} successfully`,
      data: testimonial,
    });
  } catch (error) {
    console.error("Error toggling testimonial approval:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle approval status",
    });
  }
};

/**
 * PATCH /api/admin/website/testimonials/:id/approve
 * Approve testimonial
 */
exports.approveTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    testimonial.isApproved = true;
    testimonial.approvedBy = req.user.id;
    testimonial.approvedAt = new Date();

    await testimonial.save();

    res.json({
      success: true,
      message: "Testimonial approved successfully",
      data: testimonial,
    });
  } catch (error) {
    console.error("Error approving testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve testimonial",
    });
  }
};

/**
 * PATCH /api/admin/website/testimonials/:id/reject
 * Reject (delete) testimonial
 */
exports.rejectTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    res.json({
      success: true,
      message: "Testimonial rejected and deleted",
    });
  } catch (error) {
    console.error("Error rejecting testimonial:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject testimonial",
    });
  }
};

/**
 * PATCH /api/admin/website/testimonials/:id/feature
 * Toggle featured status
 */
exports.toggleTestimonialFeatured = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (!testimonial) {
      return res.status(404).json({
        success: false,
        message: "Testimonial not found",
      });
    }

    testimonial.isFeatured = !testimonial.isFeatured;

    await testimonial.save();

    res.json({
      success: true,
      message: `Testimonial ${testimonial.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: { isFeatured: testimonial.isFeatured },
    });
  } catch (error) {
    console.error("Error toggling testimonial featured:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle featured status",
    });
  }
};

/**
 * PUT /api/admin/website/testimonials/reorder
 * Reorder testimonials
 */
exports.reorderTestimonials = async (req, res) => {
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
        update: { order: index },
      },
    }));

    await Testimonial.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Testimonials reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering testimonials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder testimonials",
    });
  }
};
