const GalleryCategory = require("../models/GalleryCategory");
const imageService = require("../services/image.service");

/**
 * GALLERY CONTROLLER
 * Handles CRUD operations for folder-based gallery
 *
 * IMAGE URL STRATEGY:
 * - OLD images: /assets/Brochure/** (served by frontend, no thumbnails)
 * - NEW uploads: /uploads/gallery/** (served by backend, with thumbnails)
 * - Both work simultaneously - no migration required for existing images
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/gallery
 * Get all visible gallery categories with images
 */
exports.getVisibleGalleryCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    // Filter hidden images within each category
    const processedCategories = categories.map((cat) => ({
      ...cat,
      images: cat.images
        ? cat.images
            .filter((img) => img.isVisible !== false)
            .sort((a, b) => a.order - b.order)
        : [],
    }));

    res.json({
      success: true,
      data: processedCategories,
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
 * GET /api/public/gallery/categories
 * Get gallery category names only (for navigation)
 */
exports.getGalleryCategoryNames = async (req, res) => {
  try {
    const categories = await GalleryCategory.find({ isVisible: true })
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
    console.error("Error fetching gallery category names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * GET /api/public/gallery/:slug
 * Get single gallery category by slug with images
 */
exports.getGalleryCategoryBySlug = async (req, res) => {
  try {
    const category = await GalleryCategory.findOne({
      slug: req.params.slug.toLowerCase(),
      isVisible: true,
    })
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    // Filter hidden images
    category.images = category.images
      ? category.images
          .filter((img) => img.isVisible !== false)
          .sort((a, b) => a.order - b.order)
      : [];

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching gallery category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery category",
    });
  }
};

/**
 * GET /api/public/gallery/all-images
 * Get all gallery images flattened (for gallery grid view)
 */
exports.getAllGalleryImages = async (req, res) => {
  try {
    const { limit = 100, page = 1 } = req.query;

    const categories = await GalleryCategory.find({ isVisible: true })
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
    const paginatedImages = allImages.slice(
      startIndex,
      startIndex + parseInt(limit),
    );

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
    console.error("Error fetching all gallery images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery images",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/gallery
 * Get all gallery categories (admin view)
 */
exports.getAllGalleryCategories = async (req, res) => {
  try {
    const categories = await GalleryCategory.find()
      .sort({ order: 1 })
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
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
 * GET /api/admin/website/gallery/:id
 * Get single gallery category by ID (admin)
 */
exports.getGalleryCategoryById = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id)
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error fetching gallery category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gallery category",
    });
  }
};

/**
 * POST /api/admin/website/gallery
 * Create gallery category
 */
exports.createGalleryCategory = async (req, res) => {
  try {
    const { name, slug, description, coverImageUrl, images, order, isVisible } =
      req.body;

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
      images: processedImages,
      order: order || 0,
      isVisible: isVisible !== false,
      createdBy: req.user.id,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Gallery category created successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error creating gallery category:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this slug already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create gallery category",
    });
  }
};

/**
 * PUT /api/admin/website/gallery/:id
 * Update gallery category
 */
exports.updateGalleryCategory = async (req, res) => {
  try {
    const { name, description, coverImageUrl, images, order, isVisible } =
      req.body;

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
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
      message: "Gallery category updated successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error updating gallery category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gallery category",
    });
  }
};

/**
 * DELETE /api/admin/website/gallery/:id
 * Delete gallery category
 */
exports.deleteGalleryCategory = async (req, res) => {
  try {
    const category = await GalleryCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    res.json({
      success: true,
      message: "Gallery category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting gallery category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gallery category",
    });
  }
};

/**
 * PATCH /api/admin/website/gallery/:id/toggle
 * Toggle gallery category visibility
 */
exports.toggleGalleryCategoryVisibility = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
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
    console.error("Error toggling gallery category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle visibility",
    });
  }
};

/**
 * PUT /api/admin/website/gallery/reorder
 * Reorder gallery categories
 */
exports.reorderGalleryCategories = async (req, res) => {
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

    await GalleryCategory.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    console.error("Error reordering gallery categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder categories",
    });
  }
};

// ==================== IMAGE MANAGEMENT WITHIN CATEGORY ====================

/**
 * POST /api/admin/website/gallery/:id/images
 * Add images to gallery category
 */
exports.addImagesToGalleryCategory = async (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Images array is required",
      });
    }

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    // Get current max order
    const maxOrder =
      category.images.length > 0
        ? Math.max(...category.images.map((img) => img.order))
        : -1;

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
      data: {
        categoryId: category._id,
        addedCount: newImages.length,
        totalImages: category.images.length,
      },
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
 * PUT /api/admin/website/gallery/:id/images/:imageId
 * Update single image in gallery category
 */
exports.updateGalleryImage = async (req, res) => {
  try {
    const { url, title, altText, order, isVisible } = req.body;

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
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
      data: {
        _id: image._id,
        url: image.url,
        title: image.title,
        altText: image.altText,
        order: image.order,
        isVisible: image.isVisible,
      },
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
 * DELETE /api/admin/website/gallery/:id/images/:imageId
 * Delete single image from gallery category
 */
exports.deleteGalleryImage = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
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
 * PUT /api/admin/website/gallery/:id/images/reorder
 * Reorder images within gallery category
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

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
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
    });
  } catch (error) {
    console.error("Error reordering images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder images",
    });
  }
};

// ==================== IMAGE UPLOAD ENDPOINTS ====================

/**
 * POST /api/admin/website/gallery/upload
 * Upload single image and get URL
 * Returns processed image URL for use in category creation/update
 */
exports.uploadSingleImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    const result = await imageService.processAndSaveImage(
      req.file.buffer,
      req.file.originalname
    );

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.url,
        thumbnailUrl: result.thumbnailUrl,
        originalName: result.originalName,
      },
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};

/**
 * POST /api/admin/website/gallery/upload/multiple
 * Upload multiple images at once
 * Returns array of processed image URLs
 */
exports.uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const results = await imageService.processMultipleImages(req.files);

    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    res.status(201).json({
      success: true,
      message: `${successful.length} images uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
      data: {
        uploaded: successful.map((r) => ({
          url: r.url,
          thumbnailUrl: r.thumbnailUrl,
          originalName: r.originalName,
        })),
        failed: failed.map((r) => ({
          originalName: r.originalName,
          error: r.error,
        })),
      },
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload images",
    });
  }
};

/**
 * POST /api/admin/website/gallery/:id/upload
 * Upload images directly to a category
 * Combines upload + add to category in single request
 */
exports.uploadImagesToCategory = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No image files provided",
      });
    }

    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    // Process all uploaded images
    const results = await imageService.processMultipleImages(req.files);
    const successful = results.filter((r) => r.success);

    if (successful.length === 0) {
      return res.status(400).json({
        success: false,
        message: "All image uploads failed",
      });
    }

    // Get current max order
    const maxOrder =
      category.images.length > 0
        ? Math.max(...category.images.map((img) => img.order))
        : -1;

    // Add processed images to category
    const newImages = successful.map((img, index) => ({
      url: img.url,
      thumbnailUrl: img.thumbnailUrl,
      title: img.originalName.replace(/\.[^/.]+$/, ""), // Filename without extension
      altText: "",
      order: maxOrder + 1 + index,
      isVisible: true,
    }));

    category.images.push(...newImages);
    category.updatedBy = req.user.id;

    await category.save();

    const failed = results.filter((r) => !r.success);

    res.status(201).json({
      success: true,
      message: `${successful.length} images uploaded and added to category${failed.length > 0 ? `, ${failed.length} failed` : ""}`,
      data: {
        categoryId: category._id,
        uploaded: newImages.length,
        totalImages: category.images.length,
        failed: failed.length,
      },
    });
  } catch (error) {
    console.error("Error uploading images to category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload images",
    });
  }
};

/**
 * DELETE /api/admin/website/gallery/:id/images/:imageId/file
 * Delete image file when removing from category
 * Only deletes files from /uploads/, not /assets/
 */
exports.deleteGalleryImageWithFile = async (req, res) => {
  try {
    const category = await GalleryCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Gallery category not found",
      });
    }

    const image = category.images.id(req.params.imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Delete file if it's an uploaded image (not old /assets/ image)
    if (image.url && image.url.startsWith("/uploads/")) {
      await imageService.deleteImage(image.url);
    }

    // Remove from category
    image.deleteOne();
    category.updatedBy = req.user.id;

    await category.save();

    res.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image with file:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};
