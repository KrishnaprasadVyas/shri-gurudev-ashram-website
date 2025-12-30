import { useState, useEffect } from 'react';

const AnnouncementBanner = ({ announcements }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (!announcements || announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className="bg-amber-500 text-white py-3 px-4 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <div className="flex items-center space-x-4 w-full">
          <div className="flex-1 text-center">
            <p className="text-sm md:text-base font-medium">
              {currentAnnouncement.text}
            </p>
          </div>
          {announcements.length > 1 && (
            <div className="flex space-x-1">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex ? 'bg-white' : 'bg-amber-300'
                  }`}
                  aria-label={`Go to announcement ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBanner;

