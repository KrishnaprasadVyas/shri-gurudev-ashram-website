import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { activitiesApi } from "../services/adminApi";

const ActivitiesContext = createContext();

export const ActivitiesProvider = ({ children }) => {
  const [activitiesItems, setActivitiesItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all activities from API (for admin)
   */
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activitiesApi.getAll();
      const activities = (response.data || []).map((activity, index) => ({
        ...activity,
        id: activity._id,
        order: activity.order || index + 1,
        visible: activity.isVisible !== false,
        shortDescription: activity.description || "",
        imageUrl: activity.imageUrl || "",
      }));
      setActivitiesItems(activities);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch visible activities from API (for public)
   */
  const fetchVisibleActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await activitiesApi.getVisible();
      const activities = (response.data || []).map((activity, index) => ({
        ...activity,
        id: activity._id,
        order: activity.order || index + 1,
        visible: true,
        shortDescription: activity.description || "",
        imageUrl: activity.imageUrl || "",
      }));
      setActivitiesItems(activities);
    } catch (err) {
      console.error("Error fetching visible activities:", err);
      setActivitiesItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new activity
   */
  const addActivity = useCallback(
    async (activityData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await activitiesApi.create({
          title: activityData.title,
          description: activityData.shortDescription,
          iconKey: activityData.icon || activityData.iconKey,
          category: activityData.category,
          isVisible: activityData.visible !== false,
          subitems: activityData.subitems || [],
        });
        const newActivity = {
          ...response.data,
          id: response.data._id,
          order: activitiesItems.length + 1,
          visible: response.data.isVisible !== false,
          shortDescription: response.data.description || "",
        };
        setActivitiesItems((prev) => [...prev, newActivity]);
        return newActivity;
      } catch (err) {
        console.error("Error creating activity:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [activitiesItems.length],
  );

  /**
   * Update an activity
   */
  const updateActivity = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await activitiesApi.update(id, {
        title: updates.title,
        description: updates.shortDescription,
        iconKey: updates.icon || updates.iconKey,
        category: updates.category,
        isVisible: updates.visible !== false,
        subitems: updates.subitems,
      });
      setActivitiesItems((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id
            ? {
                ...item,
                ...response.data,
                id: response.data._id,
                visible: response.data.isVisible !== false,
                shortDescription: response.data.description || "",
              }
            : item,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error updating activity:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an activity
   */
  const deleteActivity = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await activitiesApi.delete(id);
      setActivitiesItems((prev) =>
        prev.filter((item) => item.id !== id && item._id !== id),
      );
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle activity visibility
   */
  const toggleVisibility = useCallback(async (id) => {
    setError(null);
    try {
      const response = await activitiesApi.toggle(id);
      setActivitiesItems((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id
            ? {
                ...item,
                visible: response.data.isVisible,
                isVisible: response.data.isVisible,
              }
            : item,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error toggling activity visibility:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Move activity order
   */
  const moveActivity = useCallback(
    async (id, direction) => {
      const items = [...activitiesItems];
      const index = items.findIndex(
        (item) => item.id === id || item._id === id,
      );

      if (index === -1) return;

      if (direction === "up" && index > 0) {
        [items[index], items[index - 1]] = [items[index - 1], items[index]];
      } else if (direction === "down" && index < items.length - 1) {
        [items[index], items[index + 1]] = [items[index + 1], items[index]];
      }

      items.forEach((item, idx) => {
        item.order = idx + 1;
      });

      setActivitiesItems(items);

      // Persist reorder to backend
      try {
        const orderedIds = items.map((item) => item.id || item._id);
        await activitiesApi.reorder(orderedIds);
      } catch (err) {
        console.error("Error reordering activities:", err);
      }
    },
    [activitiesItems],
  );

  /**
   * Get visible activities sorted by order (for public)
   */
  const getVisibleActivities = useCallback(() => {
    return activitiesItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id || item._id,
        title: item.title,
        description: item.shortDescription || item.description,
        image: item.imageUrl,
        icon: item.icon || item.iconKey,
        category: item.category,
        subitems: item.subitems || [],
      }));
  }, [activitiesItems]);

  /**
   * Get all unique categories
   */
  const getCategories = useCallback(() => {
    const categories = new Set(activitiesItems.map((item) => item.category));
    return Array.from(categories).filter(Boolean);
  }, [activitiesItems]);

  // Fetch visible activities on mount (for public pages)
  useEffect(() => {
    fetchVisibleActivities();
  }, [fetchVisibleActivities]);

  const value = {
    activitiesItems,
    loading,
    error,
    fetchActivities,
    fetchVisibleActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleVisibility,
    moveActivity,
    getVisibleActivities,
    getCategories,
  };

  return (
    <ActivitiesContext.Provider value={value}>
      {children}
    </ActivitiesContext.Provider>
  );
};

export const useActivities = () => {
  const context = useContext(ActivitiesContext);
  if (!context) {
    throw new Error("useActivities must be used within ActivitiesProvider");
  }
  return context;
};
