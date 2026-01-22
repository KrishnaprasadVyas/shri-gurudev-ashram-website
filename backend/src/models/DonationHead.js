const mongoose = require("mongoose");

/**
 * Sub-cause Schema (embedded)
 * For donation heads that have specific sub-categories
 */
const subCauseSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Sub-cause name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    minAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

/**
 * Donation Head Schema
 * For managing donation causes/heads dynamically
 * Replaces hardcoded donationHeads in frontend
 *
 * IMPORTANT: name is the primary identifier used in Donation records
 * Do NOT use numeric IDs for donation tracking
 */
const donationHeadSchema = new mongoose.Schema(
  {
    // Unique identifier key (e.g., "annadan", "education")
    key: {
      type: String,
      required: [true, "Donation head key is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    // Display name (e.g., "Annadan Seva", "Education")
    name: {
      type: String,
      required: [true, "Donation head name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    // Detailed description for individual cause page
    longDescription: {
      type: String,
      trim: true,
      default: "",
    },
    // Image URL (stored on filesystem/CDN)
    imageUrl: {
      type: String,
      trim: true,
      default: null,
    },
    // Icon key for frontend mapping
    iconKey: {
      type: String,
      enum: {
        values: [
          "annadan",
          "education",
          "medical",
          "infrastructure",
          "maintenance",
          "goushala",
          "anath",
          "general",
          "spiritual",
          "environment",
        ],
        message: "Invalid icon key",
      },
      default: "general",
    },
    // Minimum donation amount (optional)
    minAmount: {
      type: Number,
      min: [0, "Minimum amount cannot be negative"],
      default: null,
    },
    // Suggested/preset amounts for this cause
    presetAmounts: {
      type: [Number],
      default: [100, 500, 1000, 2500, 5000, 10000],
    },
    // Sub-causes for specific donation options
    subCauses: [subCauseSchema],
    // Display order
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Featured causes appear prominently
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Tax deductible info
    is80GEligible: {
      type: Boolean,
      default: true,
    },
    // Goal tracking (optional)
    goalAmount: {
      type: Number,
      min: 0,
      default: null,
    },
    currentAmount: {
      type: Number,
      min: 0,
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
  }
);

// Indexes
donationHeadSchema.index({ isActive: 1, order: 1 });
donationHeadSchema.index({ isFeatured: 1 });
// Note: key already has unique index from field definition

// Virtual to get collected percentage
donationHeadSchema.virtual("collectedPercentage").get(function () {
  if (!this.goalAmount || this.goalAmount === 0) return null;
  return Math.min(100, Math.round((this.currentAmount / this.goalAmount) * 100));
});

// Enable virtuals in JSON
donationHeadSchema.set("toJSON", { virtuals: true });
donationHeadSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("DonationHead", donationHeadSchema);
