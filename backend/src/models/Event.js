const mongoose = require("mongoose");

/**
 * Event Schema
 * For managing upcoming and past events
 * Supports status tracking and visibility control
 */
const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    // Event date and time
    date: {
      type: Date,
      required: [true, "Event date is required"],
    },
    time: {
      type: String,
      trim: true,
      default: "",
    },
    // End date for multi-day events (optional)
    endDate: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      default: "",
    },
    // Image URL (stored on filesystem/CDN, not binary)
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Event status
    status: {
      type: String,
      enum: {
        values: ["upcoming", "ongoing", "past", "cancelled"],
        message: "Status must be upcoming, ongoing, past, or cancelled",
      },
      default: "upcoming",
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    // Featured events appear prominently
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Optional registration URL
    registrationUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Optional tags for filtering
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Audit trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for efficient querying
eventSchema.index({ date: -1 });
eventSchema.index({ status: 1, isPublished: 1 });
eventSchema.index({ isFeatured: 1 });

// Pre-save middleware to auto-update status based on date
eventSchema.pre("save", function () {
  const now = new Date();
  const eventDate = new Date(this.date);

  // Only auto-update if not manually set to cancelled
  if (this.status !== "cancelled") {
    if (this.endDate) {
      const endDate = new Date(this.endDate);
      if (now > endDate) {
        this.status = "past";
      } else if (now >= eventDate && now <= endDate) {
        this.status = "ongoing";
      } else {
        this.status = "upcoming";
      }
    } else {
      // Single day event - check if event day has passed
      const eventDay = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
      );
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      if (today > eventDay) {
        this.status = "past";
      } else {
        this.status = "upcoming";
      }
    }
  }
});

module.exports = mongoose.model("Event", eventSchema);
