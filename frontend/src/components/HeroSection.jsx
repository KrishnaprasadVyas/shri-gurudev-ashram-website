import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HeroSection = ({ title, subtitle, image, showCTA = true }) => {
  const { t } = useTranslation();
  return (
    <div
      className={`relative h-[60vh] md:h-[70vh] flex ${
        image ? "items-start" : "items-center"
      } justify-center overflow-hidden`}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: image
            ? `url(${image})`
            : "linear-gradient(135deg, rgba(180, 83, 9, 0.8) 0%, rgba(146, 64, 14, 0.9) 100%)",
        }}
      >
        {!image && (
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/80 to-amber-800/60"></div>
        )}
      </div>

      {/* Content */}
      <div
        className={`relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto ${
          image ? "pt-8 md:pt-12 lg:pt-16" : ""
        }`}
      >
        <h1
          className={`font-bold text-white mb-2 drop-shadow-lg ${
            image
              ? "text-3xl md:text-5xl whitespace-nowrap"
              : "text-4xl md:text-6xl"
          }`}
        >
          {title || t("hero.welcome")}
        </h1>
        {subtitle && (
          <p
            className={`text-lg md:text-xl text-amber-100 mb-6 drop-shadow-md ${image ? "" : "mb-8"}`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* CTA Buttons: keep at bottom when image is present, otherwise inline with content */}
      {showCTA && image && (
        <div className="absolute left-0 right-0 bottom-8 z-10 flex justify-center px-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="px-8 py-3 bg-amber-600 text-white rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
            >
              {t("hero.donateNow")}
            </Link>
            <button
              type="button"
              disabled
              className="px-8 py-3 bg-white text-amber-500 rounded-lg text-lg font-semibold shadow-lg cursor-not-allowed opacity-80"
              aria-disabled="true"
              title={t("nav.comingSoon")}
            >
              {t("hero.shopComingSoon")}
            </button>
          </div>
        </div>
      )}

      {showCTA && !image && (
        <div className="relative z-10 text-center mt-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="px-8 py-3 bg-amber-600 text-white rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
            >
              {t("hero.donateNow")}
            </Link>
            <button
              type="button"
              disabled
              className="px-8 py-3 bg-white text-amber-500 rounded-lg text-lg font-semibold shadow-lg cursor-not-allowed opacity-80"
              aria-disabled="true"
              title={t("nav.comingSoon")}
            >
              {t("hero.shopComingSoon")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeroSection;
