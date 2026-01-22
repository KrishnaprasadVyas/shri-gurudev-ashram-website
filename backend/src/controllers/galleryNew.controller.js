const Gallery = require("../models/Gallery");
const GalleryCategory = require("../models/GalleryCategory");

/**
 * GALLERY CONTROLLER (Refactored)
 * Handles CRUD operations for general gallery images and categories
 * Images are stored as URLs only, not binary data
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/gallery
 * Get visible gallery images
 */
exports.getVisibleGalleryImages = async (req, res) => {
  try {
    const { category, limit = 50, page = 1 } = req.query;

    const filter = { isVisible: true };
    if (category) filter.category = category.toLowerCase();

    const images = await Gallery.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select("-createdBy -updatedBy -__v")
      .lean();

    const total = await Gallery.countDocuments(filter);

    res.json({
      success: true,
      data: images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
    });
  }
};

/**
 * GET /api/public/gallery/categories
 * Get visible gallery categories
 */
exports.getVisibleCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching gallery categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery categories",
    });
  }
};

/**
 * GET /api/public/gallery/by-category
 * Get gallery images grouped by category
 */
exports.getImagesGroupedByCategory = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get visible categories
    const categories = await GalleryCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .lean();

    // Get images for each category
    const result = await Promise.all(
      categories.map(async (cat) => {
        const images = await Gallery.find({
          category: cat.slug,
          isVisible: true,
        })
          .sort({ order: 1 })
          .limit(parseInt(limit))
          .select("imageUrl thumbnailUrl title altText")
          .lean();

        return {
          ...cat,
          images,
        };
      })
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching grouped gallery:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/gallery
 * Get all gallery images (admin view)
 */
exports.getAllGalleryImages = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, visibility } = req.query;

    const filter = {};
    if (category) filter.category = category.toLowerCase();
    if (visibility === "visible") filter.isVisible = true;
    if (visibility === "hidden") filter.isVisible = false;

    const images = await Gallery.find(filter)
      .sort({ category: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await Gallery.countDocuments(filter);

    res.json({
      success: true,
      data: images,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
    });
  }
};

/**
 * GET /api/admin/website/gallery/:id
 * Get single gallery image by ID
 */
exports.getGalleryImageById = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    res.json({
      success: true,
      data: image,
    });
  } catch (error) {
    console.error("Error fetching gallery image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery image",
    });
  }
};

/**
 * POST /api/admin/website/gallery
 * Create gallery item (stores URL only)
 */
exports.createGalleryItem = async (req, res) => {
  try {
    const {
      imageUrl,
      thumbnailUrl,
      title,
      category,
      altText,
      description,
      order,
      isVisible,
      metadata,
    } = req.body;

    // Validation
    if (!imageUrl || imageUrl.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    if (!category || category.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const image = new Gallery({
      imageUrl: imageUrl.trim(),
      thumbnailUrl: thumbnailUrl?.trim() || null,
      title: title?.trim() || "",
      category: category.toLowerCase().trim(),
      altText: altText?.trim() || title?.trim() || "",
      description: description?.trim() || "",
      order: order || 0,
      isVisible: isVisible !== false,
      metadata: metadata || {},
      createdBy: req.user.id,
    });

    await image.save();

    res.status(201).json({
      success: true,
      message: "Gallery image added successfully",
      data: image,
    });
  } catch (error) {
    console.error("Error creating gallery item:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create gallery item",
    });
  }
};

/**
 * POST /api/admin/website/gallery/bulk
 * Add multiple gallery images at once
 */
exports.bulkCreateGalleryItems = async (req, res) => {
  try {
    const { images, category } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images array is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    const galleryItems = images.map((img, index) => ({
      imageUrl: typeof img === "string" ? img : img.imageUrl,
      thumbnailUrl: img.thumbnailUrl || null,
      title: img.title || "",
      category: category.toLowerCase().trim(),
      altText: img.altText || img.title || "",
      description: img.description || "",
      order: img.order !== undefined ? img.order : index,
      isVisible: img.isVisible !== false,
      createdBy: req.user.id,
    }));

    const created = await Gallery.insertMany(galleryItems);

    res.status(201).json({
      success: true,
      message: `${created.length} gallery images added successfully`,
      data: created,
    });
  } catch (error) {
    console.error("Error bulk creating gallery items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create gallery items",
    });
  }
};

/**
 * PUT /api/admin/website/gallery/:id
 * Update gallery item
 */
exports.updateGalleryItem = async (req, res) => {
  try {
    const {
      imageUrl,
      thumbnailUrl,
      title,
      category,
      altText,
      description,
      order,
      isVisible,
      metadata,
    } = req.body;

    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    // Update fields
    if (imageUrl !== undefined) image.imageUrl = imageUrl.trim();
    if (thumbnailUrl !== undefined) image.thumbnailUrl = thumbnailUrl?.trim() || null;
    if (title !== undefined) image.title = title.trim();
    if (category !== undefined) image.category = category.toLowerCase().trim();
    if (altText !== undefined) image.altText = altText.trim();
    if (description !== undefined) image.description = description.trim();
    if (order !== undefined) image.order = order;
    if (isVisible !== undefined) image.isVisible = isVisible;
    if (metadata !== undefined) image.metadata = metadata;

    image.updatedBy = req.user.id;

    await image.save();

    res.json({
      success: true,
      message: "Gallery image updated successfully",
      data: image,
    });
  } catch (error) {
    console.error("Error updating gallery item:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update gallery item",
    });
  }
};

/**
 * DELETE /api/admin/website/gallery/:id
 * Delete gallery item
 */
exports.deleteGalleryItem = async (req, res) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    res.json({
      success: true,
      message: "Gallery image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery item",
    });
  }
};

/**
 * PATCH /api/admin/website/gallery/:id/toggle
 * Toggle gallery image visibility
 */
exports.toggleGalleryVisibility = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Gallery image not found",
      });
    }

    image.isVisible = !image.isVisible;
    image.updatedBy = req.user.id;

    await image.save();

    res.json({
      success: true,
      message: `Gallery image ${image.isVisible ? "shown" : "hidden"} successfully`,
      data: { isVisible: image.isVisible },
    });
  } catch (error) {
    console.error("Error toggling gallery visibility:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle visibility",
    });
  }
};

/**
 * PUT /api/admin/website/gallery/reorder
 * Reorder gallery images
 */
exports.reorderGalleryImages = async (req, res) => {
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

    await Gallery.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Gallery images reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering gallery:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder gallery images",
    });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

/**
 * GET /api/admin/website/gallery/categories
 * Get all gallery categories (admin)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find()
      .sort({ order: 1 })
      .populate("createdBy", "fullName")
      .lean();

    // Get image counts
    const counts = await Gallery.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countsMap = counts.reduce((acc, c) => {
      acc[c._id] = c.count;
      return acc;
    }, {});

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      imageCount: countsMap[cat.slug] || 0,
    }));

    res.json({
      success: true,
      data: enrichedCategories,
    });
  } catch (error) {
    console.error("Error fetching gallery categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * POST /api/admin/website/gallery/categories
 * Create gallery category
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, coverImageUrl, order, isVisible } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = new GalleryCategory({
      name: name.trim(),
      slug:
        slug?.toLowerCase().trim() ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: description?.trim() || "",
      coverImageUrl: coverImageUrl || null,
      order: order || 0,
      isVisible: isVisible !== false,
      createdBy: req.user.id,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category",
    });
  }
};

/**
 * PUT /api/admin/website/gallery/categories/:id
 * Update gallery category
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, coverImageUrl, order, isVisible } = req.body;

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Note: We don't update slug to avoid breaking image references
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (coverImageUrl !== undefined) category.coverImageUrl = coverImageUrl;
    if (order !== undefined) category.order = order;
    if (isVisible !== undefined) category.isVisible = isVisible;

    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

/**
 * DELETE /api/admin/website/gallery/categories/:id
 * Delete gallery category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { force } = req.query;

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check for images in this category
    const imageCount = await Gallery.countDocuments({ category: category.slug });

    if (imageCount > 0 && force !== "true") {
      return res.status(400).json({
        success: false,
        message: `Cannot delete: ${imageCount} images exist in this category. Use force=true to delete anyway.`,
        imageCount,
      });
    }

    if (imageCount > 0 && force === "true") {
      // Delete all images in this category
      await Gallery.deleteMany({ category: category.slug });
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: `Category deleted${imageCount > 0 ? ` along with ${imageCount} images` : ""}`,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};
