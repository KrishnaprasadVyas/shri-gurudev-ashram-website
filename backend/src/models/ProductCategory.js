const mongoose = require("mongoose");

/**
 * Product Category Schema
 * For organizing shop products into categories
 */
const productCategorySchema = new mongoose.Schema(
  {
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
    // Cover/banner image for category page
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Icon key for frontend
    iconKey: {
      type: String,
      trim: true,
      default: null,
    },
    // Parent category for hierarchy (optional)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
    isVisible: {
      type: Boolean,
      default: true,
    },
    // Featured categories appear on homepage
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // SEO
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160,
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
// Note: slug already has unique index from field definition
productCategorySchema.index({ isVisible: 1, order: 1 });
productCategorySchema.index({ parent: 1 });

// Pre-save middleware to generate slug if not provided
productCategorySchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
});

// Virtual for product count (populated separately)
productCategorySchema.virtual("productCount", {
  ref: "Product",
  localField: "_id",
  foreignField: "category",
  count: true,
});

// Enable virtuals
productCategorySchema.set("toJSON", { virtuals: true });
productCategorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("ProductCategory", productCategorySchema);
