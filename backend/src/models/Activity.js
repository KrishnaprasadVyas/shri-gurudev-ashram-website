const mongoose = require("mongoose");

/**
 * Activity Subitem Schema (embedded)
 * Represents individual activities within a category
 */
const subitemSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, "Subitem title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    points: [
      {
        type: String,
        trim: true,
      },
    ],
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

/**
 * Activity Schema
 * Represents activity categories (Festival Celebration, Annadan Seva, etc.)
 * Each activity can have multiple subitems
 */
const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: String,
      enum: {
        values: ["spiritual", "social", "educational", "cultural", "other"],
        message: "Invalid category",
      },
      default: "spiritual",
    },
    // Icon key (e.g., "festival", "food", "yoga") - frontend maps to actual icons
    iconKey: {
      type: String,
      trim: true,
      default: "default",
    },
    // Optional image for the activity
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    subitems: [subitemSchema],
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
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
  }
);

// Indexes
activitySchema.index({ isVisible: 1, order: 1 });
activitySchema.index({ category: 1 });

module.exports = mongoose.model("Activity", activitySchema);
