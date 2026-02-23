import { useState, useEffect } from "react";
import { siteConfigApi } from "../../services/adminApi";

const LiveLinkManager = () => {
  const [liveLink, setLiveLink] = useState({
    url: "",
    isActive: false,
    label: "Live",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const data = await siteConfigApi.getConfig();
      if (data.liveLink) {
        setLiveLink(data.liveLink);
      }
    } catch (error) {
      console.error("Error fetching config:", error);
      setMessage({ type: "error", text: "Failed to load configuration" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const result = await siteConfigApi.updateLiveLink(liveLink);
      setMessage({ type: "success", text: result.message });
      if (result.liveLink) {
        setLiveLink(result.liveLink);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update live link",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async () => {
    const newState = !liveLink.isActive;

    // If enabling, URL must be set
    if (newState && !liveLink.url) {
      setMessage({ type: "error", text: "Please enter a URL first" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const result = await siteConfigApi.updateLiveLink({
        ...liveLink,
        isActive: newState,
      });
      setMessage({ type: "success", text: result.message });
      if (result.liveLink) {
        setLiveLink(result.liveLink);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.message || "Failed to toggle live link",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-3 text-gray-600">Loading configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Live Stream Link
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              When enabled, a &quot;Live&quot; button with a pulsing animation
              will appear in the navbar next to the social media icons.
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
              liveLink.isActive ? "bg-red-600" : "bg-gray-200"
            } ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                liveLink.isActive ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Status indicator */}
        <div
          className={`mb-6 flex items-center gap-2 px-4 py-3 rounded-lg ${
            liveLink.isActive
              ? "bg-red-50 border border-red-200"
              : "bg-gray-50 border border-gray-200"
          }`}
        >
          {liveLink.isActive ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-semibold text-red-700">
                Live button is ACTIVE — visible to all users
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
              </span>
              <span className="text-sm font-medium text-gray-600">
                Live button is OFF — not visible to users
              </span>
            </>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="liveUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Live Stream URL *
            </label>
            <input
              id="liveUrl"
              type="url"
              value={liveLink.url}
              onChange={(e) =>
                setLiveLink({ ...liveLink, url: e.target.value })
              }
              placeholder="https://youtube.com/live/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              YouTube Live, Facebook Live, or any streaming URL
            </p>
          </div>

          <div>
            <label
              htmlFor="liveLabel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Button Label
            </label>
            <input
              id="liveLabel"
              type="text"
              value={liveLink.label}
              onChange={(e) =>
                setLiveLink({ ...liveLink, label: e.target.value })
              }
              placeholder="Live"
              maxLength={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
            />
            <p className="mt-1 text-xs text-gray-500">
              Text shown on the button (max 20 chars). Default: &quot;Live&quot;
            </p>
          </div>

          {/* Preview */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
            <div className="flex items-center gap-4 bg-amber-50 p-4 rounded-lg">
              <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-bold shadow-md live-btn">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span>{liveLink.label || "Live"}</span>
              </div>
              <span className="text-xs text-gray-500">
                ← This is how the button will look in the navbar
              </span>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`px-4 py-3 rounded-lg text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveLinkManager;
