import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import DonationFlow from "./DonationFlow";
import DonorList from "./DonorList";
import { donationHeads, donationIcons } from "../../data/dummyData";

// Heart Icon for donate button
const HeartIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
  </svg>
);

// Component to render SVG icon from string
const CauseIcon = ({ iconKey, className }) => {
  const iconSvg = donationIcons[iconKey];
  if (!iconSvg) return null;

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: iconSvg }} />
  );
};

const DonationPage = () => {
  const donationFlowRef = useRef(null);
  const [selectedCause, setSelectedCause] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [searchParams] = useSearchParams();

  // Check if Quick Donate was clicked (from header)
  useEffect(() => {
    const quickDonate = searchParams.get("quick");
    if (quickDonate === "true") {
      const generalSeva = donationHeads.find((h) => h.name === "General Seva");
      if (generalSeva) {
        setSelectedCause(generalSeva);
        // Scroll to donation flow after component renders
        setTimeout(() => {
          if (donationFlowRef.current) {
            donationFlowRef.current.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }
        }, 300);
      }
    }
  }, [searchParams]);

  const handleCauseSelect = (head) => {
    setSelectedCause(head);
    // Scroll to donation flow after component renders
    setTimeout(() => {
      if (donationFlowRef.current) {
        donationFlowRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 300);
  };

  const handleImageError = (headId) => {
    setImageErrors((prev) => ({ ...prev, [headId]: true }));
  };

  return (
    <>
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionHeading
            title="Make a Donation"
            subtitle="Choose a cause close to your heart and make a difference"
            center={true}
          />

          {/* Donation Heads */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {donationHeads.map((head) => (
              <button
                key={head.id}
                onClick={() => handleCauseSelect(head)}
                className={`rounded-lg border transition-all text-left overflow-hidden ${
                  selectedCause?.id === head.id
                    ? "border-amber-600 border-4 bg-amber-50 shadow-lg"
                    : "border-amber-200 bg-amber-50 hover:border-amber-400 hover:shadow-md"
                }`}
              >
                <div className="w-full aspect-[4/3] overflow-hidden bg-amber-100 flex items-center justify-center">
                  {imageErrors[head.id] ? (
                    <div className="w-full h-full flex items-center justify-center text-amber-600 text-4xl font-bold">
                      {head.name.charAt(0)}
                    </div>
                  ) : (
                    <img
                      src={head.image}
                      alt={head.name}
                      className="w-full h-full object-cover"
                      onError={() => handleImageError(head.id)}
                    />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {head.icon && (
                        <CauseIcon
                          iconKey={head.icon}
                          className="w-5 h-5 text-amber-600 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full"
                        />
                      )}
                      <h3 className="text-lg font-bold text-amber-900">
                        {head.name}
                      </h3>
                    </div>
                    {selectedCause?.id === head.id && (
                      <span className="text-amber-600">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm">{head.description}</p>
                  {head.minAmount && (
                    <p className="text-xs text-amber-700 mt-1 font-medium">
                      Min. donation: ₹{head.minAmount.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Impact Section */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-center">Your Impact</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-amber-100">Families Fed</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">5,000+</div>
                <div className="text-amber-100">Children Educated</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">2,000+</div>
                <div className="text-amber-100">Medical Camps</div>
              </div>
            </div>
          </div>

          {/* Live Donor List */}
          <DonorList />

          {/* Donation Flow - Only show when a cause is selected */}
          {selectedCause && (
            <div ref={donationFlowRef} className="mt-12">
              <DonationFlow selectedCause={selectedCause} />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default DonationPage;
