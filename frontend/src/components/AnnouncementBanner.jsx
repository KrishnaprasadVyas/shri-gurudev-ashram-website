import { useState, useEffect } from "react";
import { useAnnouncement } from "../context/AnnouncementContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

const AnnouncementBanner = () => {
  const { announcements } = useAnnouncement();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Filter only active announcements
  const activeAnnouncements = announcements.filter((a) => a.isActive);

  // Auto-scroll effect
  useEffect(() => {
    if (activeAnnouncements.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [activeAnnouncements.length, isPaused]);

  // Reset index if announcements change
  useEffect(() => {
    if (currentIndex >= activeAnnouncements.length) {
      setCurrentIndex(0);
    }
  }, [activeAnnouncements.length, currentIndex]);

  // Only render if there are active announcements
  if (activeAnnouncements.length === 0) return null;

  const currentAnnouncement = activeAnnouncements[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? activeAnnouncements.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <div
      className="bg-amber-500 text-white py-3 md:py-4 px-2 shadow-md"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2 md:gap-4 w-full min-h-6">
          {/* Previous button - only show if multiple announcements */}
          {activeAnnouncements.length > 1 && (
            <button
              onClick={goToPrevious}
              className="p-1 hover:bg-amber-600 rounded-full transition-colors flex-shrink-0"
              aria-label="Previous announcement"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* Announcement text with slide animation */}
          <div className="flex-1 text-center overflow-hidden">
            <p
              key={currentIndex}
              className="text-sm md:text-base font-medium leading-relaxed animate-fade-in"
            >
              {currentAnnouncement?.text || currentAnnouncement?.message}
            </p>
          </div>

          {/* Next button - only show if multiple announcements */}
          {activeAnnouncements.length > 1 && (
            <button
              onClick={goToNext}
              className="p-1 hover:bg-amber-600 rounded-full transition-colors flex-shrink-0"
              aria-label="Next announcement"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Dots indicator - only show if multiple announcements */}
      {activeAnnouncements.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {activeAnnouncements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-amber-300"
              }`}
              aria-label={`Go to announcement ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementBanner;
