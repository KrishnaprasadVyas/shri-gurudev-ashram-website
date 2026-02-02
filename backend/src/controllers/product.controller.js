const Product = require("../models/Product");
const ProductCategory = require("../models/ProductCategory");

/**
 * PRODUCT CONTROLLER
 * Handles CRUD operations for shop products
 */

// ==================== PUBLIC ROUTES ====================

/**
 * GET /api/public/products
 * Get active products with pagination
 */
exports.getActiveProducts = async (req, res) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = "order",
      order = "asc",
      limit = 20,
      page = 1,
    } = req.query;

    const filter = { isActive: true };

    // Category filter
    if (category) {
      const categoryDoc = await ProductCategory.findOne({
        $or: [{ slug: category }, { _id: category }],
      });
      if (categoryDoc) {
        filter.category = categoryDoc._id;
      }
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === "true") {
      filter.$or = [{ trackInventory: false }, { stock: { $gt: 0 } }];
    }

    // Featured filter
    if (featured === "true") {
      filter.isFeatured = true;
    }

    // Sort options
    const sortOptions = {};
    switch (sort) {
      case "price":
        sortOptions.price = order === "desc" ? -1 : 1;
        break;
      case "name":
        sortOptions.name = order === "desc" ? -1 : 1;
        break;
      case "newest":
        sortOptions.createdAt = -1;
        break;
      default:
        sortOptions.order = 1;
        sortOptions.createdAt = -1;
    }

    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("category", "name slug")
      .select("-createdBy -updatedBy -__v")
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * GET /api/public/products/featured
 * Get featured products
 */
exports.getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({ order: 1 })
      .limit(parseInt(limit))
      .populate("category", "name slug")
      .select("name slug shortDescription price compareAtPrice imageUrl category inStock")
      .lean();

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching featured products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch featured products",
    });
  }
};

/**
 * GET /api/public/products/:slug
 * Get single product by slug
 */
exports.getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slug,
      isActive: true,
    })
      .populate("category", "name slug")
      .select("-createdBy -updatedBy -__v")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/**
 * GET /api/public/products/categories
 * Get visible product categories
 */
exports.getVisibleCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find({ isVisible: true })
      .sort({ order: 1 })
      .select("-createdBy -updatedBy -__v")
      .lean();

    // Get product counts
    const counts = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countsMap = counts.reduce((acc, c) => {
      acc[c._id.toString()] = c.count;
      return acc;
    }, {});

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      productCount: countsMap[cat._id.toString()] || 0,
    }));

    res.json({
      success: true,
      data: enrichedCategories,
    });
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ==================== ADMIN ROUTES ====================

/**
 * GET /api/admin/website/products
 * Get all products (admin view)
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 50, category, active, lowStock } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (active === "true") filter.isActive = true;
    if (active === "false") filter.isActive = false;
    if (lowStock === "true") {
      filter.trackInventory = true;
      filter.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
    }

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("category", "name slug")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName")
      .lean();

    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * GET /api/admin/website/products/:id
 * Get single product by ID (admin)
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name slug")
      .populate("createdBy", "fullName")
      .populate("updatedBy", "fullName");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/**
 * POST /api/admin/website/products
 * Create product
 */
exports.createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      imageUrl,
      images,
      category,
      subcategory,
      stock,
      trackInventory,
      lowStockThreshold,
      sku,
      weight,
      dimensions,
      tags,
      isActive,
      isFeatured,
      order,
      metaTitle,
      metaDescription,
    } = req.body;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Description is required",
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required",
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required",
      });
    }

    // Verify category exists
    const categoryDoc = await ProductCategory.findById(category);
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      shortDescription: shortDescription?.trim() || "",
      price,
      compareAtPrice: compareAtPrice || null,
      imageUrl: imageUrl || null,
      images: images || [],
      category,
      subcategory: subcategory || null,
      stock: stock || 0,
      trackInventory: trackInventory !== false,
      lowStockThreshold: lowStockThreshold || 5,
      sku: sku || null,
      weight: weight || {},
      dimensions: dimensions || {},
      tags: tags || [],
      isActive: isActive !== false,
      isFeatured: isFeatured === true,
      order: order || 0,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
      createdBy: req.user.id,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: {
        _id: product._id,
        name: product.name,
      },
    });
  } catch (error) {
    console.error("Error creating product:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }

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
      message: "Failed to create product",
    });
  }
};

/**
 * PUT /api/admin/website/products/:id
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      compareAtPrice,
      imageUrl,
      images,
      category,
      subcategory,
      stock,
      trackInventory,
      lowStockThreshold,
      sku,
      weight,
      dimensions,
      tags,
      isActive,
      isFeatured,
      order,
      metaTitle,
      metaDescription,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update fields
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (shortDescription !== undefined) product.shortDescription = shortDescription.trim();
    if (price !== undefined) product.price = price;
    if (compareAtPrice !== undefined) product.compareAtPrice = compareAtPrice;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (images !== undefined) product.images = images;
    if (category !== undefined) product.category = category;
    if (subcategory !== undefined) product.subcategory = subcategory;
    if (stock !== undefined) product.stock = stock;
    if (trackInventory !== undefined) product.trackInventory = trackInventory;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (sku !== undefined) product.sku = sku;
    if (weight !== undefined) product.weight = weight;
    if (dimensions !== undefined) product.dimensions = dimensions;
    if (tags !== undefined) product.tags = tags;
    if (isActive !== undefined) product.isActive = isActive;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (order !== undefined) product.order = order;
    if (metaTitle !== undefined) product.metaTitle = metaTitle;
    if (metaDescription !== undefined) product.metaDescription = metaDescription;

    product.updatedBy = req.user.id;

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: {
        _id: product._id,
        name: product.name,
      },
    });
  } catch (error) {
    console.error("Error updating product:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Product with this SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update product",
    });
  }
};

/**
 * DELETE /api/admin/website/products/:id
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};

/**
 * PATCH /api/admin/website/products/:id/toggle
 * Toggle product active status
 */
exports.toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    product.isActive = !product.isActive;
    product.updatedBy = req.user.id;

    await product.save();

    res.json({
      success: true,
      message: `Product ${product.isActive ? "activated" : "deactivated"} successfully`,
      data: { isActive: product.isActive },
    });
  } catch (error) {
    console.error("Error toggling product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle product status",
    });
  }
};

/**
 * PATCH /api/admin/website/products/:id/stock
 * Update product stock
 */
exports.updateProductStock = async (req, res) => {
  try {
    const { stock, adjustment } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (stock !== undefined) {
      product.stock = stock;
    } else if (adjustment !== undefined) {
      product.stock = Math.max(0, product.stock + adjustment);
    }

    product.updatedBy = req.user.id;

    await product.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: { stock: product.stock },
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
    });
  }
};

// ==================== CATEGORY MANAGEMENT ====================

/**
 * GET /api/admin/website/products/categories
 * Get all product categories (admin)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find()
      .sort({ order: 1 })
      .populate("createdBy", "fullName")
      .lean();

    // Get product counts
    const counts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countsMap = counts.reduce((acc, c) => {
      acc[c._id.toString()] = c.count;
      return acc;
    }, {});

    const enrichedCategories = categories.map((cat) => ({
      ...cat,
      productCount: countsMap[cat._id.toString()] || 0,
    }));

    res.json({
      success: true,
      data: enrichedCategories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

/**
 * POST /api/admin/website/products/categories
 * Create product category
 */
exports.createCategory = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      imageUrl,
      iconKey,
      parent,
      order,
      isVisible,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const category = new ProductCategory({
      name: name.trim(),
      slug:
        slug?.toLowerCase().trim() ||
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: description?.trim() || "",
      imageUrl: imageUrl || null,
      iconKey: iconKey || null,
      parent: parent || null,
      order: order || 0,
      isVisible: isVisible !== false,
      isFeatured: isFeatured === true,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
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
 * PUT /api/admin/website/products/categories/:id
 * Update product category
 */
exports.updateCategory = async (req, res) => {
  try {
    const {
      name,
      description,
      imageUrl,
      iconKey,
      parent,
      order,
      isVisible,
      isFeatured,
      metaTitle,
      metaDescription,
    } = req.body;

    const category = await ProductCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (imageUrl !== undefined) category.imageUrl = imageUrl;
    if (iconKey !== undefined) category.iconKey = iconKey;
    if (parent !== undefined) category.parent = parent;
    if (order !== undefined) category.order = order;
    if (isVisible !== undefined) category.isVisible = isVisible;
    if (isFeatured !== undefined) category.isFeatured = isFeatured;
    if (metaTitle !== undefined) category.metaTitle = metaTitle;
    if (metaDescription !== undefined) category.metaDescription = metaDescription;

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
 * DELETE /api/admin/website/products/categories/:id
 * Delete product category
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { force, reassignTo } = req.query;

    const category = await ProductCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check for products in this category
    const productCount = await Product.countDocuments({ category: category._id });

    if (productCount > 0) {
      if (reassignTo) {
        // Reassign products to another category
        await Product.updateMany(
          { category: category._id },
          { category: reassignTo }
        );
      } else if (force !== "true") {
        return res.status(400).json({
          success: false,
          message: `Cannot delete: ${productCount} products exist in this category. Use reassignTo or force=true.`,
          productCount,
        });
      }
      // If force=true without reassign, products will have invalid category reference
    }

    await category.deleteOne();

    res.json({
      success: true,
      message: `Category deleted${productCount > 0 && reassignTo ? `, ${productCount} products reassigned` : ""}`,
    });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete category",
    });
  }
};
