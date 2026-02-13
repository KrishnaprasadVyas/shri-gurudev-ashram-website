import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate, formatDateTime } from "../utils/helpers";

const EventCard = ({ event }) => {
  const { t } = useTranslation();
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-amber-100">
      <div className="relative h-48 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
        {event.status === "upcoming" && (
          <span className="absolute top-4 right-4 bg-amber-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {t("events.upcoming")}
          </span>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-amber-900 mb-2">{event.title}</h3>
        <div className="space-y-2 text-sm text-gray-600 mb-4">
          <p className="flex itemscenter">
            {formatDateTime(event.date, event.time)}
          </p>
          <p className="flex items-center">{event.location}</p>
        </div>
        <p className="text-gray-700 mb-4 line-clamp-2">{event.description}</p>
        <Link
          to={`/events/${event.id}`}
          className="inline-block px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          {t("events.learnMore")}
        </Link>
      </div>
    </div>
  );
};

export default EventCard;
