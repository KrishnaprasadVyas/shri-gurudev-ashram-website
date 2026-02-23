const mongoose = require("mongoose");

/**
 * SiteConfig Model
 * Stores site-wide configuration settings (singleton pattern).
 * Only one document should exist in this collection.
 */
const siteConfigSchema = new mongoose.Schema(
  {
    // Live stream / live event link
    liveLink: {
      url: { type: String, default: "" },
      isActive: { type: Boolean, default: false },
      label: { type: String, default: "Live" },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to get or create the singleton config document
 */
siteConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model("SiteConfig", siteConfigSchema);
