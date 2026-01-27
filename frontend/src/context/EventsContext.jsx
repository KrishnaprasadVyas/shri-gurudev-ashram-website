import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { eventsApi } from "../services/adminApi";

const EventsContext = createContext();

export const EventsProvider = ({ children }) => {
  const [eventsItems, setEventsItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all events from API (for admin)
   */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventsApi.getAll();
      const events = (response.data || []).map((event, index) => ({
        ...event,
        id: event._id,
        order: event.order || index + 1,
        visible: event.isPublished !== false,
      }));
      setEventsItems(events);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch published events from API (for public)
   */
  const fetchPublishedEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await eventsApi.getPublished();
      const events = (response.data || []).map((event, index) => ({
        ...event,
        id: event._id,
        order: index + 1,
        visible: true,
      }));
      setEventsItems(events);
    } catch (err) {
      console.error("Error fetching published events:", err);
      setEventsItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Add a new event
   */
  const addEvent = useCallback(
    async (eventData) => {
      setLoading(true);
      setError(null);
      try {
        const response = await eventsApi.create({
          title: eventData.title,
          description: eventData.description,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          imageUrl: eventData.imageUrl,
          isPublished: eventData.visible !== false,
        });
        const newEvent = {
          ...response.data,
          id: response.data._id,
          order: eventsItems.length + 1,
          visible: response.data.isPublished !== false,
        };
        setEventsItems((prev) => [...prev, newEvent]);
        return newEvent;
      } catch (err) {
        console.error("Error creating event:", err);
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [eventsItems.length],
  );

  /**
   * Update an event
   */
  const updateEvent = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    try {
      const response = await eventsApi.update(id, {
        ...updates,
        isPublished: updates.visible !== false,
      });
      setEventsItems((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id
            ? {
                ...item,
                ...response.data,
                id: response.data._id,
                visible: response.data.isPublished !== false,
              }
            : item,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error updating event:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete an event
   */
  const deleteEvent = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await eventsApi.delete(id);
      setEventsItems((prev) =>
        prev.filter((item) => item.id !== id && item._id !== id),
      );
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Toggle event visibility/publish status
   */
  const toggleVisibility = useCallback(async (id) => {
    setError(null);
    try {
      const response = await eventsApi.togglePublish(id);
      setEventsItems((prev) =>
        prev.map((item) =>
          item.id === id || item._id === id
            ? {
                ...item,
                visible: response.data.isPublished,
                isPublished: response.data.isPublished,
              }
            : item,
        ),
      );
      return response.data;
    } catch (err) {
      console.error("Error toggling event visibility:", err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Move event order (local only for now, can be extended with reorder API)
   */
  const moveEvent = useCallback(
    (id, direction) => {
      const items = [...eventsItems];
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

      setEventsItems(items);
    },
    [eventsItems],
  );

  /**
   * Get visible events sorted by order (for public events page)
   */
  const getVisibleEvents = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return eventsItems
      .filter((item) => item.visible)
      .sort((a, b) => a.order - b.order)
      .map((item) => {
        const eventDate = new Date(item.date);
        eventDate.setHours(0, 0, 0, 0);
        const isUpcoming = eventDate >= today;

        return {
          id: item.id || item._id,
          title: item.title,
          description: item.description,
          date: item.date,
          time: item.time,
          location: item.location,
          image: item.imageUrl,
          status: item.status || (isUpcoming ? "upcoming" : "past"),
        };
      });
  }, [eventsItems]);

  // Fetch published events on mount (for public pages)
  useEffect(() => {
    fetchPublishedEvents();
  }, [fetchPublishedEvents]);

  const value = {
    eventsItems,
    loading,
    error,
    fetchEvents,
    fetchPublishedEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleVisibility,
    moveEvent,
    getVisibleEvents,
  };

  return (
    <EventsContext.Provider value={value}>{children}</EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within EventsProvider");
  }
  return context;
};
