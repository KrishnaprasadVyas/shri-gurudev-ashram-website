import { useState, useEffect } from "react";
import SectionHeading from "../components/SectionHeading";
import TestimonialCard from "../components/TestimonialCard";
import { Loader2 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/testimonials`);
        const data = await response.json();
        if (data.success) {
          setTestimonials(data.data || []);
        } else {
          setError(data.message || "Failed to load testimonials");
        }
      } catch (err) {
        console.error("Error fetching testimonials:", err);
        setError("Failed to load testimonials");
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Devotee Testimonials"
            subtitle="Stories of transformation, gratitude, and spiritual growth"
            center={true}
          />
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600">{error}</div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No testimonials available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <TestimonialCard
                  key={testimonial._id || testimonial.id}
                  testimonial={testimonial}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Share Your Experience */}
      <section className="py-16 px-4 bg-amber-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-amber-900 mb-4">
            Share Your Experience
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            We would love to hear about your journey with us. Your story can
            inspire others!
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-semibold"
          >
            Contact Us
          </a>
        </div>
      </section>
    </>
  );
};

export default Testimonials;
