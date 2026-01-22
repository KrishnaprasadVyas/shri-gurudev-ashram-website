const mongoose = require("mongoose");

/**
 * Gallery Schema
 * For general gallery images (NOT brochure/folder-based gallery)
 * Stores metadata and URLs only - images live on filesystem/CDN
 */
const gallerySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      default: "",
    },
    // Image URL - absolute path or relative to public folder
    imageUrl: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    // Optional thumbnail URL (for optimized loading)
    thumbnailUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Category for filtering
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      lowercase: true,
    },
    // Alt text for accessibility
    altText: {
      type: String,
      trim: true,
      default: "",
    },
    // Caption/description
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Display order within category
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    // Optional metadata
    metadata: {
      photographer: { type: String, trim: true },
      dateTaken: { type: Date },
      location: { type: String, trim: true },
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
gallerySchema.index({ category: 1, order: 1 });
gallerySchema.index({ isVisible: 1 });

module.exports = mongoose.model("Gallery", gallerySchema);
