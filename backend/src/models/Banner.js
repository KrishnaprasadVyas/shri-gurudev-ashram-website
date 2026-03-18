const mongoose = require("mongoose");
const { multilingualField, multilingualFieldRequired } = require("../utils/multilingualField");

/**
 * Banner Schema
 * For the full-screen hero slider on the homepage
 * Admin can manage slides with background images, text overlays, and CTA buttons
 */
const bannerSchema = new mongoose.Schema(
  {
    title: multilingualFieldRequired(150, "Banner title is required"),
    subtitle: multilingualField({ maxlength: 200, default: "" }),
    description: multilingualField({ maxlength: 500, default: "" }),
    image: {
      type: String,
      required: [true, "Banner image is required"],
    },
    ctaText: multilingualField({ maxlength: 50, default: "" }),
    ctaLink: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
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
  },
);

// Index for efficient querying of active banners sorted by order
bannerSchema.index({ isActive: 1, order: 1 });

module.exports = mongoose.model("Banner", bannerSchema);
