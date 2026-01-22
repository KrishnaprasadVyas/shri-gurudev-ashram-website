const BrochureCategory = require("../models/BrochureCategory");

/**
 * BROCHURE CONTROLLER
 * Handles CRUD operations for folder-based brochure gallery
 *
 * IMPORTANT:
 * - Images exist in /public/assets/Brochure/**
 * - MongoDB stores ONLY URLs and metadata
 * - Frontend should NOT auto-scan folders
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/brochure
 * Get all visible brochure categories with images
 */
exports.getVisibleBrochureCategories = async (req, res) => {
  try {
    const categories = await BrochureCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    // Filter hidden images within each category
    const processedCategories = categories.map((cat) => ({
      ...cat,
      images: cat.images
        ? cat.images.filter((img) => img.isVisible !== false).sort((a, b) => a.order - b.order)
        : [],
    }));

    res.json({
      success: true,
      data: processedCategories,
    });
  } catch (error) {
    console.error("Error fetching brochure categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brochure categories",
    });
  }
};

/**
 * GET /api/public/brochure/categories
 * Get brochure category names only (for navigation)
 */
exports.getBrochureCategoryNames = async (req, res) => {
  try {
    const categories = await BrochureCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .select("name slug coverImageUrl imageCount")
      .lean();

    // Add image count
    const result = categories.map((cat) => ({
      ...cat,
      imageCount: cat.imageCount || 0,
    }));

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching brochure category names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * GET /api/public/brochure/:slug
 * Get single brochure category by slug with images
 */
exports.getBrochureCategoryBySlug = async (req, res) => {
  try {
    const category = await BrochureCategory.findOne({
      slug: req.params.slug.toLowerCase(),
      isVisible: true,
    })
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    // Filter hidden images
    category.images = category.images
      ? category.images.filter((img) => img.isVisible !== false).sort((a, b) => a.order - b.order)
      : [];

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching brochure category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brochure category",
    });
  }
};

/**
 * GET /api/public/brochure/all-images
 * Get all brochure images flattened (for gallery grid view)
 */
exports.getAllBrochureImages = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;

    const categories = await BrochureCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .lean();

    // Flatten all images with category info
    let allImages = [];
    categories.forEach((cat) => {
      const visibleImages = cat.images
        ? cat.images.filter((img) => img.isVisible !== false)
        : [];
      visibleImages.forEach((img) => {
        allImages.push({
          ...img,
          category: cat.name,
          categorySlug: cat.slug,
        });
      });
    });

    // Paginate
    const total = allImages.length;
    const startIndex = (page - 1) * limit;
    const paginatedImages = allImages.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: paginatedImages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching all brochure images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brochure images",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/brochure
 * Get all brochure categories (admin view)
 */
exports.getAllBrochureCategories = async (req, res) => {
  try {
    const categories = await BrochureCategory.find()
      .sort({ order: 1 })
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching brochure categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brochure categories",
    });
  }
};

/**
 * GET /api/admin/website/brochure/:id
 * Get single brochure category by ID (admin)
 */
exports.getBrochureCategoryById = async (req, res) => {
  try {
    const category = await BrochureCategory.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching brochure category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch brochure category",
    });
  }
};

/**
 * POST /api/admin/website/brochure
 * Create brochure category
 */
exports.createBrochureCategory = async (req, res) => {
  try {
    const { name, slug, description, coverImageUrl, images, order, isVisible } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Process images
    const processedImages = images
      ? images.map((img, index) => ({
          url: typeof img === "string" ? img : img.url,
          title: img.title || "",
          altText: img.altText || "",
          order: img.order !== undefined ? img.order : index,
          isVisible: img.isVisible !== false,
        }))
      : [];

    const category = new BrochureCategory({
      name: name.trim(),
      slug:
        slug?.toLowerCase().trim() ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: description?.trim() || "",
      coverImageUrl: coverImageUrl || null,
      images: processedImages,
      order: order || 0,
      isVisible: isVisible !== false,
      createdBy: req.user.id,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Brochure category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating brochure category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create brochure category",
    });
  }
};

/**
 * PUT /api/admin/website/brochure/:id
 * Update brochure category
 */
exports.updateBrochureCategory = async (req, res) => {
  try {
    const { name, description, coverImageUrl, images, order, isVisible } = req.body;

    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    // Update fields (not slug to maintain URL stability)
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (coverImageUrl !== undefined) category.coverImageUrl = coverImageUrl;
    if (order !== undefined) category.order = order;
    if (isVisible !== undefined) category.isVisible = isVisible;

    // Update images if provided
    if (images !== undefined) {
      category.images = images.map((img, index) => ({
        url: typeof img === "string" ? img : img.url,
        title: img.title || "",
        altText: img.altText || "",
        order: img.order !== undefined ? img.order : index,
        isVisible: img.isVisible !== false,
        _id: img._id || undefined, // Preserve existing IDs
      }));
    }

    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Brochure category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating brochure category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update brochure category",
    });
  }
};

/**
 * DELETE /api/admin/website/brochure/:id
 * Delete brochure category
 */
exports.deleteBrochureCategory = async (req, res) => {
  try {
    const category = await BrochureCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    res.json({
      success: true,
      message: "Brochure category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting brochure category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete brochure category",
    });
  }
};

/**
 * PATCH /api/admin/website/brochure/:id/toggle
 * Toggle brochure category visibility
 */
exports.toggleBrochureCategoryVisibility = async (req, res) => {
  try {
    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    category.isVisible = !category.isVisible;
    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: `Category ${category.isVisible ? "shown" : "hidden"} successfully`,
      data: { isVisible: category.isVisible },
    });
  } catch (error) {
    console.error("Error toggling brochure category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle visibility",
    });
  }
};

/**
 * PUT /api/admin/website/brochure/reorder
 * Reorder brochure categories
 */
exports.reorderBrochureCategories = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedIds array is required",
      });
    }

    const bulkOps = orderedIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { order: index, updatedBy: req.user.id },
      },
    }));

    await BrochureCategory.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering brochure categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder categories",
    });
  }
};

// ==================== IMAGE MANAGEMENT WITHIN CATEGORY ====================

/**
 * POST /api/admin/website/brochure/:id/images
 * Add images to brochure category
 */
exports.addImagesToBrochureCategory = async (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images array is required",
      });
    }

    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    // Get current max order
    const maxOrder =
      category.images.length > 0 ? Math.max(...category.images.map((img) => img.order)) : -1;

    // Process and add new images
    const newImages = images.map((img, index) => ({
      url: typeof img === "string" ? img : img.url,
      title: img.title || "",
      altText: img.altText || "",
      order: img.order !== undefined ? img.order : maxOrder + 1 + index,
      isVisible: img.isVisible !== false,
    }));

    category.images.push(...newImages);
    category.updatedBy = req.user.id;

    await category.save();

    res.status(201).json({
      success: true,
      message: `${newImages.length} images added successfully`,
      data: category,
    });
  } catch (error) {
    console.error("Error adding images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add images",
    });
  }
};

/**
 * PUT /api/admin/website/brochure/:id/images/:imageId
 * Update single image in brochure category
 */
exports.updateBrochureImage = async (req, res) => {
  try {
    const { url, title, altText, order, isVisible } = req.body;

    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    const image = category.images.id(req.params.imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Update image fields
    if (url !== undefined) image.url = url;
    if (title !== undefined) image.title = title;
    if (altText !== undefined) image.altText = altText;
    if (order !== undefined) image.order = order;
    if (isVisible !== undefined) image.isVisible = isVisible;

    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Image updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update image",
    });
  }
};

/**
 * DELETE /api/admin/website/brochure/:id/images/:imageId
 * Delete single image from brochure category
 */
exports.deleteBrochureImage = async (req, res) => {
  try {
    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    const image = category.images.id(req.params.imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    image.deleteOne();
    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};

/**
 * PUT /api/admin/website/brochure/:id/images/reorder
 * Reorder images within brochure category
 */
exports.reorderBrochureImages = async (req, res) => {
  try {
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "orderedIds array is required",
      });
    }

    const category = await BrochureCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Brochure category not found",
      });
    }

    // Update order for each image
    orderedIds.forEach((id, index) => {
      const image = category.images.id(id);
      if (image) {
        image.order = index;
      }
    });

    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Images reordered successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error reordering images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder images",
    });
  }
};
