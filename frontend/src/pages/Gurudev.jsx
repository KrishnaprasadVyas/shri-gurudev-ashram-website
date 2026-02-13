import { useTranslation } from "react-i18next";
import SectionHeading from "../components/SectionHeading";

const Gurudev = () => {
  const { t } = useTranslation();

  return (
    <>
      {/* Gurudev Profile Section - Spiritual & Elegant */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-50 via-orange-50/30 to-amber-50/50">
        <div className="max-w-4xl mx-auto">
          {/* Centered Profile Card */}
          <div className="flex flex-col items-center text-center">
            {/* Portrait Image */}
            <div className="relative mb-8">
              <div className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full overflow-hidden shadow-xl ring-4 ring-amber-100">
                <img
                  src="/assets/gurudev.jpg"
                  alt="Param Pujya Shri Swami Harichaitanyanand Saraswatiji Maharaj"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              {/* Subtle decorative ring */}
              <div className="absolute inset-0 w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 rounded-full border-2 border-amber-200/50 -m-1 pointer-events-none"></div>
            </div>

            {/* Name in Serif Font */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-amber-900 mb-4 leading-tight">
              {t("gurudev.name")
                .split("\n")
                .map((line, i) => (
                  <span key={i}>
                    {line}
                    {i === 0 && <br />}
                  </span>
                ))}
            </h1>

            {/* Thin Saffron Divider */}
            <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6"></div>

            {/* Short Description */}
            <p className="text-gray-600 text-lg max-w-2xl leading-relaxed">
              {t("gurudev.description")}
            </p>
          </div>
        </div>
      </section>

      {/* About Gurudev Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-6 text-center text-lg leading-relaxed">
              {t("gurudev.about1")}
            </p>
            <p className="text-gray-700 text-center text-lg leading-relaxed">
              {t("gurudev.about2")}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-5xl mx-auto">
          <SectionHeading title={t("gurudev.teachingsTitle")} center={true} />
          <div className="space-y-6">
            {[
              {
                title: t("gurudev.teaching1Title"),
                content: t("gurudev.teaching1Content"),
              },
              {
                title: t("gurudev.teaching2Title"),
                content: t("gurudev.teaching2Content"),
              },
              {
                title: t("gurudev.teaching3Title"),
                content: t("gurudev.teaching3Content"),
              },
            ].map((teaching, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold text-amber-900 mb-3">
                  {teaching.title}
                </h3>
                <p className="text-gray-700">{teaching.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div>
            <SectionHeading title={t("gurudev.aartiTitle")} center={false} />
            <div className="bg-amber-50 p-6 rounded-lg shadow-sm">
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>{t("gurudev.aarti.kakda")}</li>
                <li>{t("gurudev.aarti.morning")}</li>
                <li>{t("gurudev.aarti.haripath")}</li>
                <li>{t("gurudev.aarti.gita")}</li>
                <li>{t("gurudev.aarti.darshan")}</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2">
                {t("gurudev.timingsNote")}
              </p>
            </div>
          </div>

          <div>
            <SectionHeading title={t("gurudev.branchesTitle")} center={false} />
            <div className="bg-amber-50 p-6 rounded-lg shadow-sm space-y-2 text-gray-700">
              <p>{t("gurudev.branches.malvihir")}</p>
              <p>{t("gurudev.branches.datala")}</p>
              <p>{t("gurudev.branches.muktainagar")}</p>
              <p>{t("gurudev.branches.kothala")}</p>
              <p>{t("gurudev.branches.shindi")}</p>
              <p>{t("gurudev.branches.belgaum")}</p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title={t("gurudev.milestonesTitle")} center={true} />
          <div className="mt-8">
            <ul className="relative border-l-2 border-amber-200">
              {[
                { year: "2010", event: t("gurudev.milestones.2010") },
                { year: "2012", event: t("gurudev.milestones.2012") },
                { year: "2015", event: t("gurudev.milestones.2015") },
                { year: "2017", event: t("gurudev.milestones.2017") },
                { year: "2020", event: t("gurudev.milestones.2020") },
                { year: "2024", event: t("gurudev.milestones.2024") },
              ].map((m, idx) => (
                <li key={idx} className="mb-10 ml-6 relative">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-amber-600 rounded-full ring-8 ring-white"></span>
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-amber-600 font-bold">{m.year}</div>
                    <div className="text-gray-700">{m.event}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
};

export default Gurudev;
