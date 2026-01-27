const mongoose = require("mongoose");

/**
 * Product Schema
 * For e-commerce shop functionality
 * Stores product details with inventory tracking
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    // URL-friendly slug
    slug: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    // Short description for cards/listings
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters"],
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    // Compare at price (for showing discounts)
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    // Primary image URL
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Additional images
    images: [
      {
        url: { type: String, trim: true },
        altText: { type: String, trim: true },
        order: { type: Number, default: 0 },
      },
    ],
    // Category reference
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: [true, "Category is required"],
    },
    // Optional subcategory
    subcategory: {
      type: String,
      trim: true,
      default: null,
    },
    // Inventory
    stock: {
      type: Number,
      required: true,
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    // Track inventory (if false, unlimited stock)
    trackInventory: {
      type: Boolean,
      default: true,
    },
    // Low stock threshold for alerts
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 5,
    },
    // SKU for inventory management
    sku: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    // Product weight (for shipping)
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ["g", "kg"], default: "g" },
    },
    // Product dimensions
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      unit: { type: String, enum: ["cm", "in"], default: "cm" },
    },
    // Tags for search/filtering
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    // Product visibility
    isActive: {
      type: Boolean,
      default: true,
    },
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
    // Display order
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

// Indexes
productSchema.index({ isActive: 1, category: 1, order: 1 });
productSchema.index({ isFeatured: 1 });
// Note: slug already has unique index from field definition
productSchema.index({ tags: 1 });
productSchema.index({ "$**": "text" }); // Text search index

// Virtual for in-stock status
productSchema.virtual("inStock").get(function () {
  if (!this.trackInventory) return true;
  return this.stock > 0;
});

// Virtual for low stock status
productSchema.virtual("isLowStock").get(function () {
  if (!this.trackInventory) return false;
  return this.stock <= this.lowStockThreshold && this.stock > 0;
});

// Pre-save middleware to generate slug
productSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug =
      this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);
  }
});

// Enable virtuals in JSON
productSchema.set("toJSON", { virtuals: true });
productSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", productSchema);
