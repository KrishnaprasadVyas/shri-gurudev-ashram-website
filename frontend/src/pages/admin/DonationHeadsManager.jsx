import { useState, useEffect, useRef } from "react";
import { donationHeadsApi } from "../../services/adminApi";
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Save,
  X,
  Heart,
  Star,
  Upload,
} from "lucide-react";

const DonationHeadsManager = () => {
  const [donationHeads, setDonationHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingHead, setEditingHead] = useState(null);
  const [expandedHead, setExpandedHead] = useState(null);
  const [toast, setToast] = useState(null);
  const imageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    key: "",
    name: "",
    description: "",
    longDescription: "",
    imageUrl: "",
    imageFile: null,
    iconKey: "general",
    minAmount: "",
    presetAmounts: "100,500,1000,2500,5000,10000",
    goalAmount: "",
    order: 0,
    isActive: true,
    isFeatured: false,
    is80GEligible: true,
  });

  const iconOptions = [
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
  ];

  useEffect(() => {
    fetchDonationHeads();
  }, []);

  const fetchDonationHeads = async () => {
    setLoading(true);
    try {
      const response = await donationHeadsApi.getAll();
      setDonationHeads(response.data || []);
    } catch (error) {
      console.error("Error fetching donation heads:", error);
      showToast("Failed to load donation causes", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddNew = () => {
    setEditingHead(null);
    setFormData({
      key: "",
      name: "",
      description: "",
      longDescription: "",
      imageUrl: "",
      imageFile: null,
      iconKey: "general",
      minAmount: "",
      presetAmounts: "100,500,1000,2500,5000,10000",
      goalAmount: "",
      order: donationHeads.length,
      isActive: true,
      isFeatured: false,
      is80GEligible: true,
    });
    setShowForm(true);
  };

  const handleEdit = (head) => {
    setEditingHead(head);
    setFormData({
      key: head.key,
      name: head.name,
      description: head.description,
      longDescription: head.longDescription || "",
      imageUrl: head.imageUrl || "",
      imageFile: null,
      iconKey: head.iconKey || "general",
      minAmount: head.minAmount || "",
      presetAmounts: head.presetAmounts?.join(",") || "100,500,1000,2500,5000,10000",
      goalAmount: head.goalAmount || "",
      order: head.order || 0,
      isActive: head.isActive !== false,
      isFeatured: head.isFeatured === true,
      is80GEligible: head.is80GEligible !== false,
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
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
      const response = await donationHeadsApi.uploadImage(file);
      setFormData((prev) => ({
        ...prev,
        imageUrl: response.data.url,
        imageFile: file,
      }));
      showToast("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Failed to upload image", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim() || !formData.description.trim()) {
      showToast("Name and description are required", "error");
      return;
    }

    if (!editingHead && !formData.key.trim()) {
      showToast("Key is required for new donation cause", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        key: formData.key.toLowerCase().trim(),
        minAmount: formData.minAmount ? parseFloat(formData.minAmount) : null,
        goalAmount: formData.goalAmount ? parseFloat(formData.goalAmount) : null,
        presetAmounts: formData.presetAmounts
          ? formData.presetAmounts.split(",").map((a) => parseFloat(a.trim())).filter((a) => !isNaN(a))
          : [100, 500, 1000, 2500, 5000, 10000],
        order: parseInt(formData.order) || 0,
      };

      if (editingHead) {
        await donationHeadsApi.update(editingHead._id, payload);
        showToast("Donation cause updated successfully");
      } else {
        await donationHeadsApi.create(payload);
        showToast("Donation cause created successfully");
      }

      setShowForm(false);
      setEditingHead(null);
      fetchDonationHeads();
    } catch (error) {
      console.error("Error saving donation head:", error);
      showToast(
        error.message || "Failed to save donation cause",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (head) => {
    if (
      !window.confirm(
        `Delete "${head.name}"? This action cannot be undone and may affect existing donations.`
      )
    ) {
      return;
    }

    try {
      await donationHeadsApi.delete(head._id);
      showToast("Donation cause deleted successfully");
      fetchDonationHeads();
    } catch (error) {
      console.error("Error deleting donation head:", error);
      showToast("Failed to delete donation cause", "error");
    }
  };

  const handleToggleVisibility = async (head) => {
    try {
      await donationHeadsApi.toggle(head._id);
      showToast(`Donation cause ${head.isActive ? "deactivated" : "activated"}`);
      fetchDonationHeads();
    } catch (error) {
      console.error("Error toggling visibility:", error);
      showToast("Failed to update status", "error");
    }
  };

  const sortedHeads = [...donationHeads].sort((a, b) => (a.order || 0) - (b.order || 0));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Loading donation causes...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            toast.type === "error"
              ? "bg-red-500 text-white"
              : "bg-green-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Donation Causes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage donation heads/causes that users can donate to
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Cause
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              {/* Form Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingHead ? "Edit Donation Cause" : "Add New Donation Cause"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key (Identifier) *
                    </label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) =>
                        setFormData({ ...formData, key: e.target.value })
                      }
                      disabled={!!editingHead}
                      placeholder="annadan, education, medical"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-100"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Unique identifier (lowercase, no spaces). Cannot be changed after creation.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Annadan Seva, Education Support"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Brief description for donation form (max 500 chars)"
                    rows="3"
                    maxLength="500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/500 characters
                  </p>
                </div>

                {/* Long Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Long Description (Optional)
                  </label>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) =>
                      setFormData({ ...formData, longDescription: e.target.value })
                    }
                    placeholder="Detailed description for cause page"
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Image and Icon */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cause Image (Optional)
                    </label>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5" />
                          {formData.imageUrl ? "Change Image" : "Upload Image"}
                        </>
                      )}
                    </button>
                    {formData.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={formData.imageUrl}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, imageUrl: "", imageFile: null })
                          }
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG, WebP or GIF (max 10MB)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon Key
                    </label>
                    <select
                      value={formData.iconKey}
                      onChange={(e) =>
                        setFormData({ ...formData, iconKey: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {iconOptions.map((icon) => (
                        <option key={icon} value={icon}>
                          {icon.charAt(0).toUpperCase() + icon.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.minAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, minAmount: e.target.value })
                      }
                      placeholder="100"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.goalAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, goalAmount: e.target.value })
                      }
                      placeholder="100000"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData({ ...formData, order: e.target.value })
                      }
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Preset Amounts */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preset Amounts (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.presetAmounts}
                    onChange={(e) =>
                      setFormData({ ...formData, presetAmounts: e.target.value })
                    }
                    placeholder="100,500,1000,2500,5000,10000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Quick select amounts for donation form (e.g., 100,500,1000)
                  </p>
                </div>

                {/* Toggles */}
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Active (visible to users)
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({ ...formData, isFeatured: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Featured (show on homepage)
                    </span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is80GEligible}
                      onChange={(e) =>
                        setFormData({ ...formData, is80GEligible: e.target.checked })
                      }
                      className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      80G Eligible (tax exemption)
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingHead ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {donationHeads.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No Donation Causes Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first donation cause to get started
            </p>
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Add First Cause
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedHeads.map((head) => (
              <div
                key={head._id}
                className={`border rounded-lg transition-all ${
                  head.isActive
                    ? "border-gray-200 bg-white"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                {/* Head Card */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {head.name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {head.key}
                        </span>
                        {head.isFeatured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {!head.isActive && (
                          <span className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {head.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Order: {head.order || 0}</span>
                        <span>Icon: {head.iconKey}</span>
                        {head.minAmount && <span>Min: ₹{head.minAmount}</span>}
                        {head.goalAmount && (
                          <span>Goal: ₹{head.goalAmount.toLocaleString()}</span>
                        )}
                        {head.donationCount > 0 && (
                          <span className="text-green-600 font-medium">
                            {head.donationCount} donations (₹
                            {head.totalDonated?.toLocaleString() || 0})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setExpandedHead(
                            expandedHead === head._id ? null : head._id
                          )
                        }
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Toggle details"
                      >
                        {expandedHead === head._id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(head)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={head.isActive ? "Deactivate" : "Activate"}
                      >
                        {head.isActive ? (
                          <Eye className="w-5 h-5" />
                        ) : (
                          <EyeOff className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(head)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(head)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedHead === head._id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      {head.longDescription && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Long Description:
                          </p>
                          <p className="text-sm text-gray-600">
                            {head.longDescription}
                          </p>
                        </div>
                      )}
                      {head.imageUrl && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Image:
                          </p>
                          <img
                            src={head.imageUrl}
                            alt={head.name}
                            className="w-48 h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}
                      {head.presetAmounts && head.presetAmounts.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-700 mb-1">
                            Preset Amounts:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {head.presetAmounts.map((amount, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-amber-50 text-amber-700 text-sm rounded-full"
                              >
                                ₹{amount}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Featured:</span>{" "}
                          <span className="font-medium">
                            {head.isFeatured ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">80G Eligible:</span>{" "}
                          <span className="font-medium">
                            {head.is80GEligible ? "Yes" : "No"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Created By:</span>{" "}
                          <span className="font-medium">
                            {head.createdBy?.fullName || "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Updated:</span>{" "}
                          <span className="font-medium">
                            {new Date(head.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonationHeadsManager;
