import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import HeroSection from "../components/HeroSection";
import SectionHeading from "../components/SectionHeading";
import ProgramCard from "../components/ProgramCard";
import EventCard from "../components/EventCard";
import DonationCard from "../components/DonationCard";
import CTABanner from "../components/CTABanner";
import { donationHeads } from "../data/dummyData";
import { useEvents } from "../context/EventsContext";
import { useActivities } from "../context/ActivitiesContext";

const Home = () => {
  const { t } = useTranslation();
  const { getVisibleEvents } = useEvents();
  const { getVisibleActivities } = useActivities();
  const featuredActivities = getVisibleActivities().slice(0, 6);
  const upcomingEvents = getVisibleEvents()
    .filter((e) => e.status === "upcoming")
    .slice(0, 3);

  return (
    <>
      <HeroSection
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        image="/assets/Home_Page.JPG"
        showCTA={true}
      />

      {/* About Our Ashram Section - Two Column Layout */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            title={t("home.aboutTitle")}
            subtitle={t("home.aboutSubtitle")}
            center={true}
          />

          <div className="grid md:grid-cols-2 gap-8 mt-10">
            {/* Left Side - Gurudev Image Card */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-amber-100 w-full max-w-md">
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src="/assets/gurudev.jpg"
                    alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
                    className="w-full h-full object-cover object-[65%-38%]"
                  />
                </div>
                <div className="p-5 text-center bg-gradient-to-b from-amber-50/50 to-white">
                  <h3 className="text-lg font-serif font-bold text-amber-900">
                    {t("home.gurudevName1")}
                  </h3>
                  <p className="text-amber-800 font-serif">
                    {t("home.gurudevName2")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side - Stacked Info Cards */}
            <div className="flex flex-col gap-5">
              {/* Location Card */}
              <div className="bg-amber-50/70 p-6 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      {t("home.ashramLocations")}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {t("home.ashramAddress1")}
                    </p>
                    <p className="text-gray-700 text-sm leading-relaxed mt-2">
                      {t("home.ashramAddress2")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Card */}
              <div className="bg-amber-50/70 p-6 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      {t("home.contactNumbers")}
                    </h3>
                    <p className="text-gray-700">
                      <span className="font-medium">मो.</span> 9158740007,
                      9834151577
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div className="bg-amber-50/70 p-6 rounded-xl border border-amber-100 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-amber-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-amber-900 mb-2">
                      {t("home.emailWebsite")}
                    </h3>
                    <p className="text-gray-700 text-sm">
                      info@shrigurudevashram.org
                    </p>
                    <p className="text-gray-700 text-sm">
                      info@shantiashramtrust.org
                    </p>
                    <p className="text-amber-700 text-sm font-medium mt-1">
                      www.shrigurudevashram.org
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title={t("home.ourActivities")}
            subtitle={t("home.activitiesSubtitle")}
            center={true}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredActivities.map((activity) => (
              <ProgramCard key={activity.id} program={activity} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/activities"
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              {t("home.viewAllActivities")}
            </Link>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title={t("home.upcomingEvents")}
            subtitle={t("home.eventsSubtitle")}
            center={true}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              to="/events"
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
            >
              {t("home.viewAllEvents")}
            </Link>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title={t("home.supportCause")}
            subtitle={t("home.supportSubtitle")}
            center={true}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donationHeads.slice(0, 3).map((head) => (
              <DonationCard key={head.id} donation={head} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <CTABanner
        title={t("home.ctaTitle")}
        description={t("home.ctaDescription")}
        primaryAction={{ path: "/donate", label: t("home.ctaDonate") }}
        secondaryAction={{ label: t("home.ctaShop"), disabled: true }}
      />
    </>
  );
};

export default Home;
