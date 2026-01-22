const Event = require("../models/Event");

/**
 * EVENT CONTROLLER
 * Handles CRUD operations for events
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/events
 * Get published events (supports filtering by status)
 */
exports.getPublishedEvents = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;

    const filter = { isPublished: true };

    // Filter by status if provided
    if (status && ["upcoming", "ongoing", "past"].includes(status)) {
      filter.status = status;
    }

    const events = await Event.find(filter)
      .sort({ date: status === "past" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-createdBy -updatedBy -__v")
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

/**
 * GET /api/public/events/upcoming
 * Get upcoming events only
 */
exports.getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const events = await Event.find({
      isPublished: true,
      status: { $in: ["upcoming", "ongoing"] },
    })
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .select("-createdBy -updatedBy -__v")
      .lean();

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch upcoming events",
    });
  }
};

/**
 * GET /api/public/events/featured
 * Get featured events
 */
exports.getFeaturedEvents = async (req, res) => {
  try {
    const { limit = 3 } = req.query;

    const events = await Event.find({
      isPublished: true,
      isFeatured: true,
    })
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .select("-createdBy -updatedBy -__v")
      .lean();

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching featured events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured events",
    });
  }
};

/**
 * GET /api/public/events/:id
 * Get single event by ID (public)
 */
exports.getEventByIdPublic = async (req, res) => {
  try {
    const event = await Event.findOne({
      _id: req.params.id,
      isPublished: true,
    })
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/events
 * Get all events (admin view)
 */
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, published } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (published === "true") filter.isPublished = true;
    if (published === "false") filter.isPublished = false;

    const events = await Event.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      data: events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
};

/**
 * GET /api/admin/website/events/:id
 * Get single event by ID (admin)
 */
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error fetching event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
    });
  }
};

/**
 * POST /api/admin/website/events
 * Create new event
 */
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      endDate,
      location,
      imageUrl,
      status,
      isPublished,
      isFeatured,
      registrationUrl,
      tags,
    } = req.body;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Event title is required",
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Event description is required",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Event date is required",
      });
    }

    const event = new Event({
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      time: time || "",
      endDate: endDate ? new Date(endDate) : null,
      location: location?.trim() || "",
      imageUrl: imageUrl || null,
      status: status || "upcoming",
      isPublished: isPublished !== false,
      isFeatured: isFeatured === true,
      registrationUrl: registrationUrl || null,
      tags: tags || [],
      createdBy: req.user.id,
    });

    await event.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error creating event:", error);

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
      message: "Failed to create event",
    });
  }
};

/**
 * PUT /api/admin/website/events/:id
 * Update event
 */
exports.updateEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      date,
      time,
      endDate,
      location,
      imageUrl,
      status,
      isPublished,
      isFeatured,
      registrationUrl,
      tags,
    } = req.body;

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Update fields
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (date !== undefined) event.date = new Date(date);
    if (time !== undefined) event.time = time;
    if (endDate !== undefined) event.endDate = endDate ? new Date(endDate) : null;
    if (location !== undefined) event.location = location.trim();
    if (imageUrl !== undefined) event.imageUrl = imageUrl;
    if (status !== undefined) event.status = status;
    if (isPublished !== undefined) event.isPublished = isPublished;
    if (isFeatured !== undefined) event.isFeatured = isFeatured;
    if (registrationUrl !== undefined) event.registrationUrl = registrationUrl;
    if (tags !== undefined) event.tags = tags;

    event.updatedBy = req.user.id;

    await event.save();

    res.json({
      success: true,
      message: "Event updated successfully",
      data: event,
    });
  } catch (error) {
    console.error("Error updating event:", error);

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
      message: "Failed to update event",
    });
  }
};

/**
 * DELETE /api/admin/website/events/:id
 * Delete event
 */
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
    });
  }
};

/**
 * PATCH /api/admin/website/events/:id/publish
 * Toggle event publish status
 */
exports.toggleEventPublish = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    event.isPublished = !event.isPublished;
    event.updatedBy = req.user.id;

    await event.save();

    res.json({
      success: true,
      message: `Event ${event.isPublished ? "published" : "unpublished"} successfully`,
      data: { isPublished: event.isPublished },
    });
  } catch (error) {
    console.error("Error toggling event publish:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle event publish status",
    });
  }
};

/**
 * PATCH /api/admin/website/events/:id/feature
 * Toggle event featured status
 */
exports.toggleEventFeatured = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    event.isFeatured = !event.isFeatured;
    event.updatedBy = req.user.id;

    await event.save();

    res.json({
      success: true,
      message: `Event ${event.isFeatured ? "featured" : "unfeatured"} successfully`,
      data: { isFeatured: event.isFeatured },
    });
  } catch (error) {
    console.error("Error toggling event featured:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle event featured status",
    });
  }
};

/**
 * POST /api/admin/website/events/update-status
 * Bulk update event statuses based on dates
 */
exports.updateEventStatuses = async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Update past events
    const pastResult = await Event.updateMany(
      {
        status: { $ne: "cancelled" },
        date: { $lt: today },
        $or: [{ endDate: null }, { endDate: { $lt: today } }],
      },
      { $set: { status: "past" } }
    );

    // Update ongoing events (with endDate in future)
    const ongoingResult = await Event.updateMany(
      {
        status: { $ne: "cancelled" },
        date: { $lte: now },
        endDate: { $gte: now },
      },
      { $set: { status: "ongoing" } }
    );

    res.json({
      success: true,
      message: "Event statuses updated",
      data: {
        pastUpdated: pastResult.modifiedCount,
        ongoingUpdated: ongoingResult.modifiedCount,
      },
    });
  } catch (error) {
    console.error("Error updating event statuses:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event statuses",
    });
  }
};
