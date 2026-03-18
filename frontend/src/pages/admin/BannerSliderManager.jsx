import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  GripVertical,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { API_BASE_URL, getAuthToken } from "../../utils/api";
import MultilingualInput from "../../components/admin/MultilingualInput";

const toMultilingual = (val) =>
  typeof val === "object" && val !== null && "en" in val
    ? val
    : { en: val || "", hi: "", mr: "" };

const emptyMultilingual = () => ({ en: "", hi: "", mr: "" });

const toDisplayText = (val) => {
  if (typeof val === "string") return val;
  if (val && typeof val === "object") {
    return val.en || val.hi || val.mr || "";
  }
  return "";
};

const BannerSliderManager = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    title: emptyMultilingual(),
    subtitle: emptyMultilingual(),
    description: emptyMultilingual(),
    ctaText: emptyMultilingual(),
    ctaLink: "",
    isActive: true,
    order: 0,
    image: null,
  });

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/website/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setBanners(data.data);
      } else {
        setError(data.message || "Failed to fetch banners");
      }
    } catch (err) {
      console.error("Error fetching banners:", err);
      setError("Failed to fetch banners");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({
      title: emptyMultilingual(),
      subtitle: emptyMultilingual(),
      description: emptyMultilingual(),
      ctaText: emptyMultilingual(),
      ctaLink: "",
      isActive: true,
      order: banners.length,
      image: null,
    });
    setImagePreview(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      title: toMultilingual(item.title),
      subtitle: toMultilingual(item.subtitle),
      description: toMultilingual(item.description),
      ctaText: toMultilingual(item.ctaText),
      ctaLink: item.ctaLink || "",
      isActive: item.isActive !== false,
      order: item.order || 0,
      image: null,
    });
    setImagePreview(item.image);
    setShowForm(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast("Image must be less than 10MB", "error");
        return;
      }
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.en.trim()) {
      showToast("Title (English) is required", "error");
      return;
    }

    if (!editingItem && !formData.image) {
      showToast("Image is required for new banners", "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = getAuthToken();
      const fd = new FormData();
      fd.append("title", JSON.stringify(formData.title));
      fd.append("subtitle", JSON.stringify(formData.subtitle));
      fd.append("description", JSON.stringify(formData.description));
      fd.append("ctaText", JSON.stringify(formData.ctaText));
      fd.append("ctaLink", formData.ctaLink);
      fd.append("isActive", formData.isActive);
      fd.append("order", formData.order);
      if (formData.image) {
        fd.append("image", formData.image);
      }

      const url = editingItem
        ? `${API_BASE_URL}/admin/website/banners/${editingItem._id}`
        : `${API_BASE_URL}/admin/website/banners`;

      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await response.json();

      if (data.success) {
        showToast(
          editingItem
            ? "Banner updated successfully"
            : "Banner created successfully",
        );
        setShowForm(false);
        setEditingItem(null);
        fetchBanners();
      } else {
        showToast(data.message || "Failed to save banner", "error");
      }
    } catch (err) {
      console.error("Error saving banner:", err);
      showToast("Failed to save banner", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (
      !window.confirm("Delete this banner? The image will also be removed.")
    ) {
      return;
    }

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/website/banners/${item._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      if (data.success) {
        showToast("Banner deleted successfully");
        fetchBanners();
      } else {
        showToast(data.message || "Failed to delete banner", "error");
      }
    } catch (err) {
      console.error("Error deleting banner:", err);
      showToast("Failed to delete banner", "error");
    }
  };

  const handleToggle = async (item) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/admin/website/banners/${item._id}/toggle`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();
      if (data.success) {
        showToast(`Banner ${data.data.isActive ? "activated" : "deactivated"}`);
        fetchBanners();
      } else {
        showToast(data.message || "Failed to toggle status", "error");
      }
    } catch (err) {
      console.error("Error toggling banner:", err);
      showToast("Failed to toggle status", "error");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setImagePreview(null);
    setFormData({
      title: emptyMultilingual(),
      subtitle: emptyMultilingual(),
      description: emptyMultilingual(),
      ctaText: emptyMultilingual(),
      ctaLink: "",
      isActive: true,
      order: 0,
      image: null,
    });
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hero Banner Slider
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage the full-screen hero banners on the homepage ({activeCount}/5
            active)
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Banner
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Banners List */}
      <div className="space-y-4 mb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="ml-2 text-gray-600">Loading banners...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>
              No banners yet. Click "Add Banner" to create the first hero slide.
            </p>
          </div>
        ) : (
          banners.map((item) => (
            <div
              key={item._id}
              className={`p-4 border rounded-lg transition-all ${
                item.isActive
                  ? "border-amber-300 bg-amber-50"
                  : "border-gray-200 bg-white opacity-70"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-32 h-20 rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={item.image}
                    alt={toDisplayText(item.title)}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.isActive ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded font-medium">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded font-medium">
                        Inactive
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Order: {item.order}
                    </span>
                  </div>
                  <h3 className="text-gray-900 font-semibold truncate">
                    {toDisplayText(item.title)}
                  </h3>
                  {toDisplayText(item.subtitle) && (
                    <p className="text-gray-600 text-sm truncate">
                      {toDisplayText(item.subtitle)}
                    </p>
                  )}
                  {toDisplayText(item.ctaText) && (
                    <p className="text-amber-700 text-xs mt-1">
                      CTA: {toDisplayText(item.ctaText)} → {item.ctaLink}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggle(item)}
                    className={`p-2 rounded-md transition-colors ${
                      item.isActive
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={item.isActive ? "Deactivate" : "Activate"}
                  >
                    {item.isActive ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Banner" : "Add Banner"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Banner Image{" "}
                  {!editingItem && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {imagePreview ? (
                      <div className="w-48 h-28 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-28 rounded-md bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 1920×1080px. Max 10MB. JPG, PNG, or WebP.
                    </p>
                    {editingItem && (
                      <p className="text-xs text-gray-400 mt-1">
                        Leave empty to keep current image.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Title */}
              <MultilingualInput
                label="Title"
                value={formData.title}
                onChange={(val) => setFormData({ ...formData, title: val })}
                required
                placeholder="Banner headline..."
              />

              {/* Subtitle */}
              <MultilingualInput
                label="Subtitle"
                value={formData.subtitle}
                onChange={(val) => setFormData({ ...formData, subtitle: val })}
                placeholder="Optional subheading..."
              />

              {/* Description */}
              <MultilingualInput
                label="Description"
                value={formData.description}
                onChange={(val) =>
                  setFormData({ ...formData, description: val })
                }
                type="textarea"
                rows={3}
                placeholder="Optional description text..."
              />

              {/* CTA Fields */}
              <MultilingualInput
                label="CTA Button Text"
                value={formData.ctaText}
                onChange={(val) => setFormData({ ...formData, ctaText: val })}
                placeholder="e.g., Donate Now"
              />
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  CTA Link
                </label>
                <input
                  type="text"
                  value={formData.ctaLink}
                  onChange={(e) =>
                    setFormData({ ...formData, ctaLink: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="e.g., /donate or https://..."
                />
              </div>

              {/* Order & Active */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="bannerIsActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label
                    htmlFor="bannerIsActive"
                    className="text-sm text-gray-700"
                  >
                    Active (visible on homepage)
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-4 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? "Update" : "Create"}
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

export default BannerSliderManager;
