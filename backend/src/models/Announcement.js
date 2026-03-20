const mongoose = require("mongoose");
const {
  multilingualField,
  multilingualFieldRequired,
} = require("../utils/multilingualField");

/**
 * Announcement Schema
 * For displaying rotating announcements/banners on the website
 * Admin can control visibility via isActive, date range, and priority
 */
const announcementSchema = new mongoose.Schema(
  {
    text: multilingualFieldRequired(500, "Announcement text is required"),
    type: {
      type: String,
      enum: {
        values: ["event", "donation", "info", "urgent"],
        message: "Type must be event, donation, info, or urgent",
      },
      default: "info",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    // Optional link for the announcement
    linkUrl: {
      type: String,
      trim: true,
      default: null,
    },
    linkText: multilingualField({ default: "" }),
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

// Index for efficient querying of active announcements
announcementSchema.index({ isActive: 1, priority: -1 });
announcementSchema.index({ startDate: 1, endDate: 1 });

// Virtual to check if announcement is currently valid based on date range
announcementSchema.virtual("isCurrentlyActive").get(function () {
  if (!this.isActive) return false;

  const now = new Date();

  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;

  return true;
});

// Enable virtuals in JSON output
announcementSchema.set("toJSON", { virtuals: true });
announcementSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Announcement", announcementSchema);
