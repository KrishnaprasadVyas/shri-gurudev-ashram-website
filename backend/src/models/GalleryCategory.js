const mongoose = require("mongoose");

/**
 * Gallery Image Schema (embedded)
 * Stores URL and metadata for each image in the category
 */
const galleryImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      default: "",
    },
    altText: {
      type: String,
      trim: true,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true },
);

/**
 * Gallery Category Schema
 * For folder-based gallery with images grouped by category
 *
 * IMPORTANT:
 * - Images already exist in /public/assets/Brochure/**
 * - MongoDB stores ONLY URLs and metadata, NOT binary data
 * - Admin can manage categories and image URLs
 */
const galleryCategorySchema = new mongoose.Schema(
  {
    // Category/folder name
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, "Category slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // Cover image URL (first image or custom)
    coverImageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Array of image URLs with metadata
    images: [galleryImageSchema],
    // Display order
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
  },
);

// Indexes
galleryCategorySchema.index({ isVisible: 1, order: 1 });
// Note: slug already has unique index from field definition

// Pre-save middleware to generate slug and set cover image
galleryCategorySchema.pre("save", function () {
  // Generate slug if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Set cover image from first visible image if not set
  if (!this.coverImageUrl && this.images && this.images.length > 0) {
    const visibleImage = this.images.find((img) => img.isVisible);
    if (visibleImage) {
      this.coverImageUrl = visibleImage.url;
    }
  }
});

// Virtual for image count
galleryCategorySchema.virtual("imageCount").get(function () {
  return this.images ? this.images.filter((img) => img.isVisible).length : 0;
});

// Enable virtuals
galleryCategorySchema.set("toJSON", { virtuals: true });
galleryCategorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("GalleryCategory", galleryCategorySchema);
