import { useRef, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import SectionHeading from "../../components/SectionHeading";
import DonationFlow from "./DonationFlow";
import DonorList from "./DonorList";
import { donationHeads, donationIcons } from "../../data/dummyData";
import { validateReferralCode } from "../../services/collectorApi";

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

  // Referral state from URL params
  const [referralData, setReferralData] = useState({
    code: null,           // Referral code from URL
    collectorName: null,  // Resolved collector name
    isValid: false,       // Whether code was validated
    isLoading: false,     // Loading state during validation
    error: null,          // Soft error for invalid codes
  });

  // Prefill amount from URL
  const [prefillAmount, setPrefillAmount] = useState(null);

  // Manual referral entry state
  const [manualReferralInput, setManualReferralInput] = useState("");
  const [manualReferralLoading, setManualReferralLoading] = useState(false);

  // Handle URL parameters: ref, cause, amount
  useEffect(() => {
    const refCode = searchParams.get("ref");
    const causeName = searchParams.get("cause");
    const amount = searchParams.get("amount");
    const quickDonate = searchParams.get("quick");

    // Handle referral code
    if (refCode) {
      handleValidateReferralCode(refCode);
    }

    // Handle cause prefill
    if (causeName) {
      const matchedCause = donationHeads.find(
        (h) => h.name.toLowerCase() === causeName.toLowerCase()
      );
      if (matchedCause) {
        setSelectedCause(matchedCause);
      }
    } else if (quickDonate === "true") {
      // Fallback to Quick Donate behavior
      const generalSeva = donationHeads.find((h) => h.name === "General Seva");
      if (generalSeva) {
        setSelectedCause(generalSeva);
      }
    }

    // Handle amount prefill
    if (amount) {
      const parsedAmount = parseInt(amount, 10);
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        setPrefillAmount(parsedAmount);
      }
    }

    // Scroll to donation flow if any params present
    if (refCode || causeName || quickDonate === "true") {
      setTimeout(() => {
        if (donationFlowRef.current) {
          donationFlowRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 300);
    }
  }, [searchParams]);

  // Validate referral code via backend
  const handleValidateReferralCode = async (code) => {
    setReferralData((prev) => ({ ...prev, code, isLoading: true, error: null }));

    try {
      const data = await validateReferralCode(code);

      if (data.valid && data.collectorName) {
        setReferralData({
          code,
          collectorName: data.collectorName,
          isValid: true,
          isLoading: false,
          error: null,
        });
      } else {
        // Invalid code - show soft warning, allow donation to continue
        setReferralData({
          code: null,
          collectorName: null,
          isValid: false,
          isLoading: false,
          error: data.error || "Referral code not recognized. You can still donate without it.",
        });
      }
    } catch (error) {
      console.warn("Referral validation error:", error);
      // Network error - still allow donation
      setReferralData({
        code: null,
        collectorName: null,
        isValid: false,
        isLoading: false,
        error: null, // Don't show error for network issues
      });
    }
  };

  // Handle manual referral code entry
  const handleManualReferralSubmit = async () => {
    const code = manualReferralInput.trim().toUpperCase();
    if (!code) return;

    setManualReferralLoading(true);
    
    try {
      const data = await validateReferralCode(code);

      if (data.valid && data.collectorName) {
        setReferralData({
          code,
          collectorName: data.collectorName,
          isValid: true,
          isLoading: false,
          error: null,
        });
        setManualReferralInput("");
      } else {
        setReferralData((prev) => ({
          ...prev,
          error: data.error || "Invalid referral code. Please check and try again.",
        }));
      }
    } catch {
      setReferralData((prev) => ({
        ...prev,
        error: "Failed to validate referral code. Please try again.",
      }));
    } finally {
      setManualReferralLoading(false);
    }
  };

  // Clear referral code
  const handleClearReferral = () => {
    setReferralData({
      code: null,
      collectorName: null,
      isValid: false,
      isLoading: false,
      error: null,
    });
    setManualReferralInput("");
  };

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

          {/* Referral info banner - show when valid referral code exists */}
          {referralData.isValid && referralData.collectorName && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-green-800 font-medium">
                    Referred by: <span className="font-bold">{referralData.collectorName}</span>
                  </p>
                  <p className="text-green-600 text-sm">Your donation will be attributed to this collector</p>
                </div>
              </div>
              <button
                onClick={handleClearReferral}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                Clear
              </button>
            </div>
          )}

          {/* Referral loading state */}
          {referralData.isLoading && (
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-3">
              <div className="animate-spin h-5 w-5 border-2 border-amber-600 border-t-transparent rounded-full"></div>
              <p className="text-gray-600">Validating referral code...</p>
            </div>
          )}

          {/* Referral error warning - soft, doesn't block donation */}
          {referralData.error && !referralData.isValid && (
            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-700">{referralData.error}</p>
            </div>
          )}

          {/* Manual Referral Entry - show when no valid referral */}
          {!referralData.isValid && !referralData.isLoading && (
            <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-gray-700 font-medium mb-3">Have a referral code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter referral code (e.g., COLA7F9X2)"
                  value={manualReferralInput}
                  onChange={(e) => setManualReferralInput(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm font-mono uppercase"
                  maxLength={9}
                />
                <button
                  onClick={handleManualReferralSubmit}
                  disabled={!manualReferralInput.trim() || manualReferralLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {manualReferralLoading ? "Validating..." : "Apply"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                If someone shared a referral code with you, enter it here to attribute your donation to them.
              </p>
            </div>
          )}

          {/* Donation Flow - Only show when a cause is selected */}
          {selectedCause && (
            <div ref={donationFlowRef} className="mt-12">
              <DonationFlow 
                selectedCause={selectedCause} 
                referralData={referralData}
                prefillAmount={prefillAmount}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default DonationPage;
