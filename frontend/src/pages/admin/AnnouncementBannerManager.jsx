import { useState, useEffect, useCallback } from "react";
import { useAnnouncement } from "../../context/AnnouncementContext";
import { Loader2, Plus, Trash2, Edit2, X, Check } from "lucide-react";

const AnnouncementBannerManager = () => {
  const {
    announcements,
    loading,
    error,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncementById,
    deleteAnnouncement,
    toggleAnnouncement,
  } = useAnnouncement();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [formData, setFormData] = useState({
    text: "",
    priority: 1,
    isActive: true,
  });

  // Fetch announcements on mount
  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ text: "", priority: 1, isActive: true });
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      text: item.text || "",
      priority: item.priority || 1,
      isActive: item.isActive !== false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.text.trim()) {
      showToast("Announcement message is required", "error");
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await updateAnnouncementById(editingItem._id, formData);
        showToast("Announcement updated successfully");
      } else {
        await createAnnouncement(formData);
        showToast("Announcement created successfully");
      }
      setShowForm(false);
      setEditingItem(null);
      setFormData({ text: "", priority: 1, isActive: true });
    } catch (err) {
      console.error("Error saving announcement:", err);
      showToast("Failed to save announcement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm("Delete this announcement?")) {
      try {
        await deleteAnnouncement(item._id);
        showToast("Announcement deleted successfully");
      } catch (err) {
        console.error("Error deleting announcement:", err);
        showToast("Failed to delete announcement", "error");
      }
    }
  };

  const handleToggle = async (item) => {
    try {
      await toggleAnnouncement(item._id);
      showToast("Announcement status updated");
    } catch (err) {
      console.error("Error toggling announcement:", err);
      showToast("Failed to update status", "error");
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({ text: "", priority: 1, isActive: true });
  };

  // Get the active announcement for preview
  const activeAnnouncement = announcements.find((a) => a.isActive);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Announcement Banner Manager
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Control the announcement banner displayed on the public website
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Announcement
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4 mb-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            <span className="ml-2 text-gray-600">Loading announcements...</span>
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No announcements yet. Click "Add Announcement" to create one.
          </div>
        ) : (
          announcements.map((item) => (
            <div
              key={item._id}
              className={`p-4 border rounded-lg transition-all ${
                item.isActive
                  ? "border-amber-300 bg-amber-50"
                  : "border-gray-200 bg-white opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded font-medium">
                        Active
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      Priority: {item.priority || 1}
                    </span>
                  </div>
                  <p className="text-gray-900">{item.text}</p>
                </div>
                <div className="flex items-center gap-2">
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

      {/* Preview Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Live Preview
        </h2>
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          {activeAnnouncement ? (
            <div className="bg-amber-500 text-white py-3 md:py-4 px-2 shadow-md">
              <div className="max-w-7xl mx-auto flex items-center justify-center">
                <div className="flex items-center gap-4 w-full min-h-6">
                  <div className="flex-1 text-center">
                    <p className="text-sm md:text-base font-medium leading-relaxed">
                      {activeAnnouncement.text}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-500 py-8 text-center">
              <p className="text-sm">No active announcement to display</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingItem ? "Edit Announcement" : "Add Announcement"}
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
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.text}
                  onChange={(e) =>
                    setFormData({ ...formData, text: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Enter announcement message..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Priority
                </label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                  className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher priority = more important
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Active (visible on website)
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

export default AnnouncementBannerManager;
