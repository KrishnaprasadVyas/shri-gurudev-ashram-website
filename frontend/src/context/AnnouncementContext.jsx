import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { announcementsApi } from "../services/adminApi";

const AnnouncementContext = createContext();

export const AnnouncementProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get the primary active announcement for public display
  const announcement =
    announcements.length > 0
      ? {
          message: announcements.find((a) => a.isActive)?.text || "",
          active: announcements.some((a) => a.isActive),
          priority: announcements.find((a) => a.isActive)?.priority || 1,
        }
      : { message: "", active: false, priority: 1 };

  /**
   * Fetch all announcements from API (for admin)
   */
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementsApi.getAll();
      setAnnouncements(response.data || []);
    } catch (err) {
      console.error("Error fetching announcements:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch active announcements from API (for public)
   */
  const fetchActiveAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await announcementsApi.getActive();
      setAnnouncements(response.data || []);
    } catch (err) {
      console.error("Error fetching active announcements:", err);
      // Silent fail for public - use empty array
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Create a new announcement
   */
  const createAnnouncement = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementsApi.create(data);
      setAnnouncements((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      console.error("Error creating announcement:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update an announcement
   */
  const updateAnnouncementById = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await announcementsApi.update(id, data);
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? response.data : a)),
      );
      return response.data;
    } catch (err) {
      console.error("Error updating announcement:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an announcement
   */
  const deleteAnnouncement = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await announcementsApi.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      console.error("Error deleting announcement:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle announcement active status
   */
  const toggleAnnouncement = useCallback(async (id) => {
    setError(null);
    try {
      const response = await announcementsApi.toggle(id);
      setAnnouncements((prev) =>
        prev.map((a) =>
          a._id === id ? { ...a, isActive: response.data.isActive } : a,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error toggling announcement:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Legacy updateAnnouncement for backward compatibility
  const updateAnnouncement = useCallback((updates) => {
    // This is kept for backward compatibility with old usage
    // For new code, use updateAnnouncementById
    console.warn(
      "updateAnnouncement is deprecated, use updateAnnouncementById",
    );
  }, []);

  // Fetch active announcements on mount (for public pages)
  useEffect(() => {
    fetchActiveAnnouncements();
  }, [fetchActiveAnnouncements]);

  const value = {
    // State
    announcements,
    announcement, // For backward compatibility with AnnouncementBanner
    loading,
    error,
    // Actions
    fetchAnnouncements,
    fetchActiveAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    updateAnnouncementById,
    deleteAnnouncement,
    toggleAnnouncement,
  };

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncement must be used within AnnouncementProvider");
  }
  return context;
};
