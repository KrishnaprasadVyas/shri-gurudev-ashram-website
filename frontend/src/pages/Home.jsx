import { Link } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import SectionHeading from '../components/SectionHeading';
import ProgramCard from '../components/ProgramCard';
import EventCard from '../components/EventCard';
import DonationCard from '../components/DonationCard';
import CTABanner from '../components/CTABanner';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { activities, events, donationHeads, announcements } from '../data/dummyData';

const Home = () => {
  const featuredActivities = activities.slice(0, 6);
  const upcomingEvents = events.filter(e => e.status === 'upcoming').slice(0, 3);

  return (
    <>
      <HeroSection
        title="Welcome to Gurudev Ashram"
        subtitle="A sanctuary of peace, devotion, and selfless service"
        showCTA={true}
      />

      {/* About Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="About Our Ashram"
            subtitle="Dedicated to spiritual growth, social welfare, and serving humanity with love and compassion"
            center={true}
          />
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">Our Mission</h3>
              <p className="text-gray-700">
                To spread spiritual wisdom, provide humanitarian services, and create a 
                community of devotees dedicated to selfless service and inner transformation.
              </p>
            </div>
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-amber-900 mb-3">Our Vision</h3>
              <p className="text-gray-700">
                A world where every individual experiences inner peace, lives with compassion, 
                and contributes to the welfare of all beings through selfless service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Our Activities"
            subtitle="Various spiritual, social, and charitable programs for the welfare of all"
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
              View All Activities
            </Link>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Upcoming Events"
            subtitle="Join us for spiritual gatherings, seva programs, and special celebrations"
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
              View All Events
            </Link>
          </div>
        </div>
      </section>

      {/* Donation Section */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Support Our Cause"
            subtitle="Your generous contributions help us serve more people and spread love and compassion"
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
        title="Join Us in Making a Difference"
        description="Your support helps us continue our mission of service and spiritual growth"
        primaryAction={{ path: '/donate', label: 'Donate Now' }}
        secondaryAction={{ path: '/shop', label: 'Visit Shop' }}
      />
    </>
  );
};

export default Home;

