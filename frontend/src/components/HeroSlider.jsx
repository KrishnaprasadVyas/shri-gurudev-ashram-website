import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { API_BASE_URL } from "../utils/api";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

const HeroSlider = () => {
  const { t, i18n } = useTranslation();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  const getLocalizedText = (value) => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      return value[i18n.language] || value.en || value.hi || value.mr || "";
    }
    return "";
  };

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/public/banners?lang=${i18n.language || "en"}`,
        );
        const data = await response.json();
        if (data.success && data.data.length > 0) {
          setBanners(data.data);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [i18n.language]);

  // Cleanup swiper on unmount
  useEffect(() => {
    return () => {
      if (swiperRef.current && swiperRef.current.destroy) {
        swiperRef.current.destroy(true, true);
        swiperRef.current = null;
      }
    };
  }, []);

  // Fallback: static hero when no banners exist
  if (!loading && banners.length === 0) {
    return (
      <div
        className="relative w-full h-[100vh] overflow-hidden"
        style={{ marginTop: "calc(-1 * var(--app-nav-height, 120px))" }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/assets/Home_Page.JPG)" }}
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg leading-tight">
              {t("home.title")}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-amber-100 mt-3 md:mt-4 drop-shadow-md">
              {t("home.subtitle")}
            </p>
            <div className="mt-6 md:mt-8">
              <Link
                to="/donate"
                className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
              >
                {t("hero.donateNow")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading skeleton
  if (loading) {
    return (
      <div
        className="relative w-full h-[100vh] bg-gray-900 flex items-center justify-center"
        style={{ marginTop: "calc(-1 * var(--app-nav-height, 120px))" }}
      >
        <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-[100vh] overflow-hidden"
      style={{ marginTop: "calc(-1 * var(--app-nav-height, 120px))" }}
    >
      <Swiper
        modules={[Autoplay, EffectFade, Pagination]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        loop={banners.length > 1}
        pagination={{
          clickable: true,
          el: ".hero-pagination",
          bulletClass: "hero-bullet",
          bulletActiveClass: "hero-bullet-active",
        }}
        speed={800}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="h-full w-full"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner._id}>
            {/* Single slide container – exactly one bg layer + one overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${banner.image})` }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto text-center">
                {index === 0 ? (
                  <h1 className="font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg leading-tight">
                    {getLocalizedText(banner.title)}
                  </h1>
                ) : (
                  <p
                    className="font-bold text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl drop-shadow-lg leading-tight"
                    role="heading"
                    aria-level="2"
                  >
                    {getLocalizedText(banner.title)}
                  </p>
                )}

                {getLocalizedText(banner.subtitle) && (
                  <p className="text-lg sm:text-xl md:text-2xl text-amber-100 mt-3 md:mt-4 drop-shadow-md">
                    {getLocalizedText(banner.subtitle)}
                  </p>
                )}

                {getLocalizedText(banner.description) && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-200 mt-3 md:mt-4 max-w-2xl mx-auto drop-shadow-sm leading-relaxed">
                    {getLocalizedText(banner.description)}
                  </p>
                )}

                {getLocalizedText(banner.ctaText) && banner.ctaLink && (
                  <div className="mt-6 md:mt-8">
                    {banner.ctaLink.startsWith("http") ? (
                      <a
                        href={banner.ctaLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
                      >
                        {getLocalizedText(banner.ctaText)}
                      </a>
                    ) : (
                      <Link
                        to={banner.ctaLink}
                        className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg text-lg font-semibold hover:bg-amber-700 transition-colors shadow-lg"
                      >
                        {getLocalizedText(banner.ctaText)}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Pagination */}
      {banners.length > 1 && (
        <div className="hero-pagination absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2" />
      )}

      {/* Pagination dot styles only – no opacity overrides */}
      <style>{`
        .hero-bullet {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .hero-bullet-active {
          background: #d97706;
          transform: scale(1.2);
        }
        .hero-bullet:hover {
          background: rgba(255, 255, 255, 0.8);
        }
      `}</style>
    </div>
  );
};

export default HeroSlider;
