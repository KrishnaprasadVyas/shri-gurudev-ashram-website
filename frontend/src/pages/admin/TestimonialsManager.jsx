import { useState, useEffect, useCallback } from "react";
import { Star, Edit2, Trash2, Plus, X, Check, Loader2 } from "lucide-react";
import { testimonialsApi } from "../../services/adminApi";

const TestimonialsManager = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    message: "",
    rating: 5,
    visible: true,
  });
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch testimonials from API
  const fetchTestimonials = useCallback(async () => {
    setLoading(true);
    try {
      const response = await testimonialsApi.getAll();
      const data = (response.data || []).map((item) => ({
        ...item,
        id: item._id,
        visible: item.isApproved !== false,
      }));
      setTestimonials(data);
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      showToast("Failed to load testimonials", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ name: "", city: "", message: "", rating: 5, visible: true });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      city: item.city,
      message: item.message,
      rating: item.rating,
      visible: item.visible,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this testimonial?")) {
      try {
        await testimonialsApi.delete(id);
        setTestimonials((prev) =>
          prev.filter((t) => t.id !== id && t._id !== id),
        );
        showToast("Testimonial deleted successfully");
      } catch (err) {
        console.error("Error deleting testimonial:", err);
        showToast("Failed to delete testimonial", "error");
      }
    }
  };

  const toggleVisibility = async (id) => {
    try {
      const response = await testimonialsApi.toggle(id);
      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === id || t._id === id
            ? {
                ...t,
                visible: response.data.isApproved,
                isApproved: response.data.isApproved,
              }
            : t,
        ),
      );
      showToast("Visibility updated");
    } catch (err) {
      console.error("Error toggling visibility:", err);
      showToast("Failed to update visibility", "error");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name.trim() ||
      !formData.city.trim() ||
      !formData.message.trim()
    ) {
      showToast("Please fill all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        city: formData.city,
        message: formData.message,
        rating: formData.rating,
        isApproved: formData.visible,
      };

      if (editingItem) {
        const response = await testimonialsApi.update(
          editingItem.id || editingItem._id,
          payload,
        );
        setTestimonials((prev) =>
          prev.map((t) =>
            t.id === editingItem.id || t._id === editingItem._id
              ? {
                  ...response.data,
                  id: response.data._id,
                  visible: response.data.isApproved,
                }
              : t,
          ),
        );
        showToast("Testimonial updated successfully");
      } else {
        const response = await testimonialsApi.create(payload);
        const newItem = {
          ...response.data,
          id: response.data._id,
          visible: response.data.isApproved,
        };
        setTestimonials((prev) => [...prev, newItem]);
        showToast("Testimonial added successfully");
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: "",
        city: "",
        message: "",
        rating: 5,
        visible: true,
      });
    } catch (err) {
      console.error("Error saving testimonial:", err);
      showToast(
        editingItem
          ? "Failed to update testimonial"
          : "Failed to add testimonial",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ name: "", city: "", message: "", rating: 5, visible: true });
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : undefined}
            onClick={interactive ? () => onChange(star) : undefined}
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"} transition-transform`}
          >
            <Star
              className={`w-5 h-5 ${
                star <= rating
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Testimonials Manager
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage testimonials displayed on the website
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Testimonial
        </button>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="ml-2 text-gray-600">Loading testimonials...</span>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No testimonials yet. Click "Add Testimonial" to get started.
          </div>
        ) : (
          testimonials.map((item) => (
            <div
              key={item.id}
              className={`p-4 border rounded-lg transition-all ${
                item.visible
                  ? "border-gray-200 bg-white"
                  : "border-gray-100 bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <span className="text-sm text-gray-500">• {item.city}</span>
                    {!item.visible && (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                        Hidden
                      </span>
                    )}
                  </div>
                  <div className="mb-2">{renderStars(item.rating)}</div>
                  <p className="text-gray-700 text-sm">{item.message}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVisibility(item.id)}
                    className={`p-2 rounded-md transition-colors ${
                      item.visible
                        ? "text-green-600 hover:bg-green-50"
                        : "text-gray-400 hover:bg-gray-100"
                    }`}
                    title={
                      item.visible ? "Hide testimonial" : "Show testimonial"
                    }
                  >
                    {item.visible ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <X className="w-5 h-5" />
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
                    onClick={() => handleDelete(item.id)}
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Testimonial" : "Add Testimonial"}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Rajesh Kumar"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="e.g., Mumbai"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Rating
                </label>
                {renderStars(formData.rating, true, (rating) =>
                  setFormData((prev) => ({ ...prev, rating })),
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Enter the testimonial message..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visible"
                  checked={formData.visible}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      visible: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="visible" className="text-sm text-gray-700">
                  Visible on website
                </label>
              </div>

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
                  className="px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 inline-flex items-center"
                >
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingItem ? "Update" : "Add"} Testimonial
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
            } text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3`}
          >
            {toast.type === "error" ? (
              <X className="w-5 h-5" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestimonialsManager;
