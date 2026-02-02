import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { galleryApi } from "../services/adminApi";

const GalleryContext = createContext();

export const GalleryProvider = ({ children }) => {
  const [galleryCategories, setGalleryCategories] = useState([]);
  const [galleryItems, setGalleryItems] = useState([]); // Flattened images for backward compatibility
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all gallery categories from API (for admin)
   */
  const fetchGalleryCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await galleryApi.getAll();
      const categories = (response.data || []).map((cat, index) => ({
        ...cat,
        id: cat._id,
        order: cat.order || index,
        visible: cat.isVisible !== false,
      }));
      setGalleryCategories(categories);

      // Flatten images for backward compatibility
      // Include thumbnailUrl for new uploads
      const flattenedImages = [];
      categories.forEach((cat) => {
        (cat.images || []).forEach((img, imgIndex) => {
          flattenedImages.push({
            id: img._id || `${cat._id}-${imgIndex}`,
            categoryId: cat._id,
            category: cat.slug || cat.name,
            categoryName: cat.name,
            imageUrl: img.url,
            url: img.url, // Alias for compatibility
            src: img.url, // Alias for GalleryGrid
            thumbnailUrl: img.thumbnailUrl || null, // For new uploads
            title: img.title || cat.name,
            altText: img.altText || '',
            order: flattenedImages.length + 1,
            visible: img.isVisible !== false && cat.isVisible !== false,
          });
        });
      });
      setGalleryItems(flattenedImages);
    } catch (err) {
      console.error("Error fetching gallery categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch visible gallery from API (for public)
   */
  const fetchVisibleGallery = useCallback(async () => {
    setLoading(true);
    try {
      const response = await galleryApi.getVisible();
      const categories = (response.data || []).map((cat, index) => ({
        ...cat,
        id: cat._id,
        order: cat.order || index,
        visible: true,
      }));
      setGalleryCategories(categories);

      // Flatten images for backward compatibility
      // Include thumbnailUrl for new uploads
      const flattenedImages = [];
      categories.forEach((cat) => {
        (cat.images || []).forEach((img, imgIndex) => {
          flattenedImages.push({
            id: img._id || `${cat._id}-${imgIndex}`,
            categoryId: cat._id,
            category: cat.slug || cat.name,
            categoryName: cat.name,
            imageUrl: img.url,
            url: img.url, // Alias for compatibility
            src: img.url, // Alias for GalleryGrid
            thumbnailUrl: img.thumbnailUrl || null, // For new uploads
            title: img.title || cat.name,
            altText: img.altText || '',
            order: flattenedImages.length + 1,
            visible: true,
          });
        });
      });
      setGalleryItems(flattenedImages);
    } catch (err) {
      console.error("Error fetching visible gallery:", err);
      setGalleryCategories([]);
      setGalleryItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new gallery category
   */
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await galleryApi.create(categoryData);
      const newCategory = {
        ...response.data,
        id: response.data._id,
        visible: response.data.isVisible !== false,
      };
      setGalleryCategories((prev) => [...prev, newCategory]);
      return newCategory;
    } catch (err) {
      console.error("Error creating category:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update a gallery category
   */
  const updateCategory = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await galleryApi.update(id, updates);
      setGalleryCategories((prev) =>
        prev.map((cat) =>
          cat.id === id || cat._id === id
            ? {
                ...cat,
                ...response.data,
                id: response.data._id,
                visible: response.data.isVisible !== false,
              }
            : cat,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error updating category:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete a gallery category
   */
  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await galleryApi.delete(id);
      setGalleryCategories((prev) =>
        prev.filter((cat) => cat.id !== id && cat._id !== id),
      );
      // Also remove flattened images for this category
      setGalleryItems((prev) => prev.filter((item) => item.categoryId !== id));
    } catch (err) {
      console.error("Error deleting category:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle category visibility
   */
  const toggleCategoryVisibility = useCallback(async (id) => {
    setError(null);
    try {
      const response = await galleryApi.toggle(id);
      setGalleryCategories((prev) =>
        prev.map((cat) =>
          cat.id === id || cat._id === id
            ? {
                ...cat,
                visible: response.data.isVisible,
                isVisible: response.data.isVisible,
              }
            : cat,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error toggling category visibility:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Add images to a category
   */
  const addImagesToCategory = useCallback(
    async (categoryId, images) => {
      setLoading(true);
      setError(null);
      try {
        const response = await galleryApi.addImages(categoryId, images);
        // Refresh categories to get updated data
        await fetchGalleryCategories();
        return response.data;
      } catch (err) {
        console.error("Error adding images:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchGalleryCategories],
  );

  /**
   * Delete an image from a category
   */
  const deleteImage = useCallback(
    async (categoryId, imageId) => {
      setError(null);
      try {
        await galleryApi.deleteImage(categoryId, imageId);
        // Refresh categories
        await fetchGalleryCategories();
      } catch (err) {
        console.error("Error deleting image:", err);
        setError(err.message);
        throw err;
      }
    },
    [fetchGalleryCategories],
  );

  // Legacy methods for backward compatibility with GalleryManager
  const addGalleryItem = useCallback(
    async (item) => {
      // For backward compatibility - add as a new category with single image
      try {
        await createCategory({
          name: item.category || "New Category",
          images: [{ url: item.imageUrl, title: item.title }],
          isVisible: item.visible !== false,
        });
      } catch (err) {
        console.error("Error adding gallery item:", err);
      }
    },
    [createCategory],
  );

  const updateGalleryItem = useCallback(async (id, updates) => {
    // Legacy method - not fully implemented for new structure
    console.warn("updateGalleryItem is deprecated for new gallery structure");
  }, []);

  const deleteGalleryItem = useCallback(async (id) => {
    // Legacy method - not fully implemented for new structure
    console.warn("deleteGalleryItem is deprecated for new gallery structure");
  }, []);

  const toggleVisibility = useCallback(
    async (id) => {
      // Try to find if it's a category
      const category = galleryCategories.find(
        (cat) => cat.id === id || cat._id === id,
      );
      if (category) {
        await toggleCategoryVisibility(id);
      }
    },
    [galleryCategories, toggleCategoryVisibility],
  );

  const moveItem = useCallback(
    (id, direction) => {
      // Local reorder for backward compatibility
      const items = [...galleryItems];
      const index = items.findIndex((item) => item.id === id);

      if (index === -1) return;

      if (direction === "up" && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      } else if (direction === "down" && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }

      items.forEach((item, idx) => {
        item.order = idx + 1;
      });

      setGalleryItems(items);
    },
    [galleryItems],
  );

  /**
   * Get visible items sorted by order (for public gallery)
   */
  const getVisibleItems = useCallback(() => {
    return galleryItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id,
        src: item.imageUrl,
        title: item.title,
        category: item.category,
      }));
  }, [galleryItems]);

  /**
   * Get all unique categories
   */
  const getCategories = useCallback(() => {
    return galleryCategories
      .filter((cat) => cat.visible)
      .map((cat) => cat.slug || cat.name?.toLowerCase());
  }, [galleryCategories]);

  // Fetch visible gallery on mount (for public pages)
  useEffect(() => {
    fetchVisibleGallery();
  }, [fetchVisibleGallery]);

  const value = {
    // State
    galleryCategories,
    galleryItems,
    loading,
    error,
    // Category actions
    fetchGalleryCategories,
    fetchVisibleGallery,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryVisibility,
    addImagesToCategory,
    deleteImage,
    // Legacy actions for backward compatibility
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    toggleVisibility,
    moveItem,
    getVisibleItems,
    getCategories,
  };

  return (
    <GalleryContext.Provider value={value}>{children}</GalleryContext.Provider>
  );
};

export const useGallery = () => {
  const context = useContext(GalleryContext);
  if (!context) {
    throw new Error("useGallery must be used within GalleryProvider");
  }
  return context;
};
