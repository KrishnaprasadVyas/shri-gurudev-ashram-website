import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ProgramCard = ({ program }) => {
  const { t } = useTranslation();
  // Support both imageUrl and image properties
  const imageSource = program.imageUrl || program.image;

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-amber-100">
      {imageSource ? (
        <div className="relative h-44 overflow-hidden">
          <img
            src={imageSource}
            alt={program.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-20 flex items-center justify-center bg-amber-50">
          <div className="text-3xl text-amber-700">{program.icon || null}</div>
        </div>
      )}
      <div className="p-5">
        <h3 className="text-xl font-bold text-amber-900 mb-2">
          {program.title}
        </h3>
        <p className="text-gray-700 mb-4 line-clamp-2">{program.description}</p>
        <Link
          to={`/activities/${program.id}`}
          className="inline-block px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors text-sm font-medium"
        >
          {t("common.learnMore")}
        </Link>
      </div>
    </div>
  );
};

export default ProgramCard;
