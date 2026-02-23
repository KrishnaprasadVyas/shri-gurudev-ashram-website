const SiteConfig = require("../models/SiteConfig");

/**
 * ADMIN API: Get Site Config
 * GET /api/admin/website/site-config
 */
exports.getSiteConfig = async (req, res) => {
  try {
    const config = await SiteConfig.getConfig();
    res.json(config);
  } catch (error) {
    console.error("Error fetching site config:", error);
    res.status(500).json({ message: "Failed to fetch site config" });
  }
};

/**
 * ADMIN API: Update Live Link
 * PUT /api/admin/website/site-config/live-link
 *
 * Body: { url: string, isActive: boolean, label?: string }
 */
exports.updateLiveLink = async (req, res) => {
  try {
    const { url, isActive, label } = req.body;

    if (isActive && !url) {
      return res
        .status(400)
        .json({ message: "URL is required when enabling live link" });
    }

    const config = await SiteConfig.getConfig();

    config.liveLink = {
      url: url || config.liveLink.url || "",
      isActive: isActive !== undefined ? isActive : config.liveLink.isActive,
      label: label || config.liveLink.label || "Live",
    };

    await config.save();

    res.json({
      message: "Live link updated successfully",
      liveLink: config.liveLink,
    });
  } catch (error) {
    console.error("Error updating live link:", error);
    res.status(500).json({ message: "Failed to update live link" });
  }
};

/**
 * PUBLIC API: Get Live Link (active only)
 * GET /api/public/site-config/live-link
 */
exports.getPublicLiveLink = async (req, res) => {
  try {
    const config = await SiteConfig.getConfig();

    if (!config.liveLink.isActive || !config.liveLink.url) {
      return res.json({ isActive: false });
    }

    res.json({
      isActive: true,
      url: config.liveLink.url,
      label: config.liveLink.label || "Live",
    });
  } catch (error) {
    console.error("Error fetching live link:", error);
    res.json({ isActive: false });
  }
};
