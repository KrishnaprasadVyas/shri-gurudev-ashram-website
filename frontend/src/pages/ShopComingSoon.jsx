import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const ShopComingSoon = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[70vh] bg-amber-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full bg-white border border-amber-100 rounded-2xl shadow-lg p-8 sm:p-10 text-center">
        <p className="text-sm font-semibold text-amber-600 tracking-wide uppercase">
          {t("shopComingSoon.label")}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold text-amber-900 mt-2 mb-4">
          {t("shopComingSoon.title")}
        </h1>
        <p className="text-base sm:text-lg text-gray-700 mb-8">
          {t("shopComingSoon.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-6 py-3 border-2 border-amber-400 text-amber-700 rounded-lg font-semibold hover:bg-amber-50 transition-colors"
          >
            {t("shopComingSoon.backToHome")}
          </Link>
          <Link
            to="/donate"
            className="px-6 py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 transition-colors"
          >
            {t("shopComingSoon.donateNow")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ShopComingSoon;
