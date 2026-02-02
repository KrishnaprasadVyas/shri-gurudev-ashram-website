import { useState, useEffect, useRef } from "react";
import { useGallery } from "../../context/GalleryContext";
import { galleryApi } from "../../services/adminApi";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Image,
  Upload,
} from "lucide-react";

const GalleryManager = () => {
  const {
    galleryCategories,
    loading,
    error,
    fetchGalleryCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryVisibility,
    addImagesToCategory,
    deleteImage,
  } = useGallery();

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showImageForm, setShowImageForm] = useState(null); // category ID to add images to
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);

  const coverImageInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    coverImageUrl: "",
    coverImageFile: null,
    isVisible: true,
  });

  const [imageForm, setImageForm] = useState({
    files: [],
    title: "",
    altText: "",
  });

  // Fetch gallery categories on mount
  useEffect(() => {
    fetchGalleryCategories();
  }, [fetchGalleryCategories]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sortedCategories = [...galleryCategories].sort(
    (a, b) => (a.order || 0) - (b.order || 0),
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: "",
      description: "",
      coverImageUrl: "",
      coverImageFile: null,
      isVisible: true,
    });
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      coverImageUrl: category.coverImageUrl || "",
      coverImageFile: null,
      isVisible: category.visible !== false,
    });
    setShowCategoryForm(true);
  };

  const handleCoverImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      showToast("Invalid file type. Use JPG, PNG, WebP or GIF.", "error");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast("File too large. Maximum size is 10MB.", "error");
      return;
    }

    setUploading(true);
    try {
      const response = await galleryApi.uploadImage(file);
      setCategoryForm((prev) => ({
        ...prev,
        coverImageUrl: response.data.url,
        coverImageFile: file,
      }));
      showToast("Cover image uploaded");
    } catch (err) {
      console.error("Error uploading cover image:", err);
      showToast("Failed to upload cover image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(
          editingCategory.id || editingCategory._id,
          categoryForm,
        );
        showToast("Category updated successfully");
      } else {
        await createCategory(categoryForm);
        showToast("Category created successfully");
      }
      setShowCategoryForm(false);
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        description: "",
        coverImageUrl: "",
        coverImageFile: null,
        isVisible: true,
      });
    } catch (err) {
      console.error("Error saving category:", err);
      showToast("Failed to save category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (
      window.confirm(`Delete category "${category.name}" and all its images?`)
    ) {
      try {
        await deleteCategory(category.id || category._id);
        showToast("Category deleted successfully");
      } catch (err) {
        console.error("Error deleting category:", err);
        showToast("Failed to delete category", "error");
      }
    }
  };

  const handleToggleVisibility = async (category) => {
    try {
      await toggleCategoryVisibility(category.id || category._id);
      showToast("Visibility updated");
    } catch (err) {
      console.error("Error toggling visibility:", err);
      showToast("Failed to update visibility", "error");
    }
  };

  const handleAddImage = (categoryId) => {
    setShowImageForm(categoryId);
    setImageForm({ files: [], title: "", altText: "" });
  };

  const handleImageFilesChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const validFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        showToast(`${file.name}: Invalid file type`, "error");
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast(`${file.name}: File too large (max 10MB)`, "error");
        return false;
      }
      return true;
    });

    setImageForm((prev) => ({ ...prev, files: validFiles }));
  };

  const handleImageSubmit = async (e) => {
    e.preventDefault();
    if (imageForm.files.length === 0) {
      showToast("Please select at least one image", "error");
      return;
    }

    setSubmitting(true);
    try {
      // Upload images directly to category
      await galleryApi.uploadToCategory(showImageForm, imageForm.files);
      showToast(`${imageForm.files.length} image(s) uploaded successfully`);
      setShowImageForm(null);
      setImageForm({ files: [], title: "", altText: "" });
      // Refresh gallery
      fetchGalleryCategories();
    } catch (err) {
      console.error("Error uploading images:", err);
      showToast("Failed to upload images", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteImage = async (categoryId, imageId) => {
    if (window.confirm("Delete this image?")) {
      try {
        await deleteImage(categoryId, imageId);
        showToast("Image deleted successfully");
      } catch (err) {
        console.error("Error deleting image:", err);
        showToast("Failed to delete image", "error");
      }
    }
  };

  const toggleExpanded = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Manager</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage gallery categories and images for the public website
          </p>
        </div>
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Category
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="ml-2 text-gray-600">Loading gallery...</span>
          </div>
        ) : sortedCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No gallery categories yet. Click "Add Category" to get started.
          </div>
        ) : (
          sortedCategories.map((category) => (
            <div
              key={category.id || category._id}
              className={`border rounded-lg transition-all ${
                category.visible !== false
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50 opacity-70"
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center gap-4 p-4">
                {/* Cover Image */}
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {category.coverImageUrl ? (
                    <img
                      src={category.coverImageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='12' dy='10.5' font-weight='bold' x='50%25' y='50%25' text-anchor='middle'%3ENo Cover%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    {category.visible === false && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 truncate">
                      {category.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {(category.images || []).length} images • Order:{" "}
                    {category.order || 0}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleExpanded(category.id || category._id)}
                    className="p-2 text-gray-600 hover:text-amber-600 transition-colors"
                    title="View images"
                  >
                    {expandedCategory === (category.id || category._id) ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(category)}
                    className={`p-2 rounded-md transition-colors ${
                      category.visible !== false
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={
                      category.visible !== false
                        ? "Hide category"
                        : "Show category"
                    }
                  >
                    {category.visible !== false ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit category"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete category"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Expanded Images Section */}
              {expandedCategory === (category.id || category._id) && (
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Images</h4>
                    <button
                      onClick={() =>
                        handleAddImage(category.id || category._id)
                      }
                      className="inline-flex items-center px-3 py-1 text-sm bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Image
                    </button>
                  </div>

                  {(category.images || []).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No images in this category yet.
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {(category.images || []).map((img, imgIndex) => (
                        <div
                          key={img._id || imgIndex}
                          className="relative group rounded-lg overflow-hidden bg-gray-200"
                        >
                          <img
                            src={img.url}
                            alt={
                              img.title ||
                              img.altText ||
                              `Image ${imgIndex + 1}`
                            }
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              e.target.src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' font-family='sans-serif' font-size='10' dy='10.5' x='50%25' y='50%25' text-anchor='middle'%3EError%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={() =>
                                handleDeleteImage(
                                  category.id || category._id,
                                  img._id,
                                )
                              }
                              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                              title="Delete image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {img.title && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                              {img.title}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCategory ? "Edit Category" : "Add Category"}
            </h2>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) =>
                    setCategoryForm({ ...categoryForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., Goushala"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Brief description of this category"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Cover Image
                </label>
                <div className="space-y-2">
                  {/* Preview */}
                  {categoryForm.coverImageUrl && (
                    <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={categoryForm.coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setCategoryForm({ ...categoryForm, coverImageUrl: "", coverImageFile: null })}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {/* Upload button */}
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleCoverImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => coverImageInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        {categoryForm.coverImageUrl ? "Change Cover Image" : "Upload Cover Image"}
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catVisible"
                  checked={categoryForm.isVisible}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      isVisible: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="catVisible" className="text-sm text-gray-700">
                  Visible on website
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setEditingCategory(null);
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingCategory ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Image Form Modal */}
      {showImageForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Upload Images</h2>
            <form onSubmit={handleImageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Select Images <span className="text-red-500">*</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  onChange={handleImageFilesChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Choose Images (max 20)
                </button>
                {/* Selected files preview */}
                {imageForm.files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-600">
                      {imageForm.files.length} file(s) selected:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {imageForm.files.slice(0, 8).map((file, idx) => (
                        <div key={idx} className="relative aspect-square rounded overflow-hidden bg-gray-100">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {imageForm.files.length > 8 && (
                        <div className="aspect-square rounded bg-gray-200 flex items-center justify-center text-gray-600 text-sm">
                          +{imageForm.files.length - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowImageForm(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || imageForm.files.length === 0}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Upload {imageForm.files.length > 0 ? `(${imageForm.files.length})` : ""}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5">
          <div
            className={`${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            } text-white px-6 py-3 rounded-lg shadow-lg`}
          >
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryManager;
