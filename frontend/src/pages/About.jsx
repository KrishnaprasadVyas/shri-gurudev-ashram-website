import { useTranslation } from "react-i18next";
import SectionHeading from "../components/SectionHeading";
import AboutCard from "../components/AboutCard";
import { aboutCards } from "../data/aboutData";

const About = () => {
  const { t } = useTranslation();

  return (
    <>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title={t("about.programsTitle")} center={true} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {aboutCards.map((card) => (
              <AboutCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
