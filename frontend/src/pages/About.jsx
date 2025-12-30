import SectionHeading from '../components/SectionHeading';
import AboutCard from '../components/AboutCard';
import { aboutCards } from '../data/aboutData';

const About = () => {
  return (
    <>
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-700">Overview of our key programs and services</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading title="Our Programs & Services" center={true} />
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

