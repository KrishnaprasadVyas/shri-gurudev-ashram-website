import { useState } from "react";
import { useTranslation } from "react-i18next";

const AboutCard = ({ card }) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);

  const preview =
    card.content.length > 220
      ? card.content.slice(0, 220) + "..."
      : card.content;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-amber-100 flex flex-col">
      <div className="h-40 w-full overflow-hidden rounded-md mb-3">
        <img
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover"
        />
      </div>
      <h3 className="font-bold text-amber-900 mb-2">{card.title}</h3>
      <p className="text-sm text-gray-700 flex-1">{preview}</p>
      {card.content.length > 220 && (
        <div className="mt-3">
          <button
            onClick={() => setShowModal(true)}
            className="text-amber-600 hover:underline"
          >
            {t("about.learnMore")}
          </button>
        </div>
      )}

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-lg p-6 relative"
          >
            <button
              onClick={() => setShowModal(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-600 bg-white/80 hover:bg-white rounded-full p-2 shadow-sm flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className="h-56 w-full overflow-hidden rounded-md mb-4">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-amber-900 mb-4">
              {card.title}
            </h3>
            <p className="text-gray-700 whitespace-pre-line">{card.content}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutCard;
