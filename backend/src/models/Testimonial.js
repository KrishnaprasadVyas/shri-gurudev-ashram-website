const mongoose = require("mongoose");

/**
 * Testimonial Schema
 * For user testimonials/reviews
 * Supports moderation via isApproved flag
 */
const testimonialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    city: {
      type: String,
      trim: true,
      default: "",
    },
    // Optional email (for follow-up, not displayed)
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
      default: 5,
    },
    // Admin approval required for public display
    isApproved: {
      type: Boolean,
      default: false,
    },
    // Featured testimonials shown prominently
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Display order for approved testimonials
    order: {
      type: Number,
      default: 0,
    },
    // Optional avatar URL
    avatarUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Reference to user if logged in when submitting
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Audit trail
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
testimonialSchema.index({ isApproved: 1, order: 1 });
testimonialSchema.index({ isFeatured: 1 });
testimonialSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Testimonial", testimonialSchema);
