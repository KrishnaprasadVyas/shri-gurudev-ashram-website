import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import Step1AmountSelection from "./steps/Step1AmountSelection";
import Step2DonorDetails from "./steps/Step2DonorDetails";
import Step3Review from "./steps/Step3Review";
import Step4Payment from "./steps/Step4Payment";
import Step5Success from "./steps/Step5Success";

/**
 * DonationFlow - Central controller for the multi-step donation process
 *
 * Responsibilities:
 * - Holds all shared state (donation data, current step, donationId from backend)
 * - Controls step navigation (next, prev, reset)
 * - Passes props to step components
 * - Does NOT call backend directly (Step4Payment handles API calls)
 *
 * Props:
 * - selectedCause: The donation cause selected by user
 * - referralData: { code, collectorName, isValid } from URL params
 * - prefillAmount: Suggested amount from URL params
 */
const DonationFlow = ({
  selectedCause,
  onCauseProcessed,
  referralData,
  prefillAmount,
}) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);

  // Core donation state - aligned with backend API requirements
  const [donationData, setDonationData] = useState({
    // Donor identification
    mobile: "",

    // Donor personal details
    name: "",
    email: "",
    emailOptIn: false,
    emailVerified: false,
    address: "",

    // Government ID - PAN mandatory
    pan: "",
    dateOfBirth: "", // YYYY-MM-DD format for API

    // Display preferences
    anonymousDisplay: false,

    // OTP verification status
    otpVerified: false,

    // Donation specifics
    donationHead: null, // { id, name, description, image } from selected cause
    amount: 0,
    customAmount: "",

    // Referral/Collector info (from URL params, immutable during flow)
    referralCode: null, // Code from URL - sent to backend
    collectorName: null, // Resolved collector name - for display only

    // Backend-generated IDs (set by Step4Payment after API calls)
    donationId: null, // From POST /donations/create
    razorpayOrderId: null, // From POST /donations/create-order
    razorpayOrderAmount: null, // Stored for retry - amount in paise from backend
    razorpayKey: null, // Stored for retry
    razorpayPaymentId: null, // From Razorpay checkout callback

    // Receipt info
    receiptNumber: null,

    // Legacy field for backward compatibility with Step5Success
    transactionId: null,
  });

  // Initialize referral data from props (once, on mount or when referralData changes)
  useEffect(() => {
    if (referralData?.isValid && referralData?.code) {
      setDonationData((prev) => ({
        ...prev,
        referralCode: referralData.code,
        collectorName: referralData.collectorName,
      }));
    }
  }, [referralData]);

  // Initialize prefill amount from props
  useEffect(() => {
    if (prefillAmount && prefillAmount > 0) {
      setDonationData((prev) => ({
        ...prev,
        amount: prefillAmount,
        customAmount: prefillAmount.toString(),
      }));
    }
  }, [prefillAmount]);

  // When a cause is selected from DonationPage, update state and reset to step 1
  useEffect(() => {
    if (selectedCause) {
      setDonationData((prev) => ({ ...prev, donationHead: selectedCause }));
      setCurrentStep(1);
    }
  }, [selectedCause]);

  /**
   * Update donation data - merges new data with existing state
   * Used by step components to update their respective fields
   */
  const updateData = useCallback((data) => {
    setDonationData((prev) => ({ ...prev, ...data }));
  }, []);

  /**
   * Navigate to next step
   */
  const nextStep = useCallback(() => {
    setCurrentStep((prev) => prev + 1);
  }, []);

  /**
   * Navigate to previous step
   */
  const prevStep = useCallback(() => {
    setCurrentStep((prev) => prev - 1);
  }, []);

  /**
   * Reset entire flow - clears all data and goes back to step 1
   * SECURITY: Clears sensitive fields (PAN/Aadhaar) from memory
   * NOTE: Preserves referral data from URL (immutable during session)
   */
  const resetFlow = useCallback(() => {
    setCurrentStep(1);
    setDonationData((prev) => ({
      mobile: "",
      name: "",
      email: "",
      emailOptIn: false,
      emailVerified: false,
      address: "",
      pan: "",
      dateOfBirth: "",
      anonymousDisplay: false,
      otpVerified: false,
      donationHead: null,
      amount: prefillAmount || 0,
      customAmount: prefillAmount ? prefillAmount.toString() : "",
      // Preserve referral data - it came from URL and should persist
      referralCode: prev.referralCode,
      collectorName: prev.collectorName,
      donationId: null,
      razorpayOrderId: null,
      razorpayOrderAmount: null,
      razorpayKey: null,
      razorpayPaymentId: null,
      receiptNumber: null,
      transactionId: null,
    }));
  }, [prefillAmount]);

  // Step definitions for progress indicator
  const steps = [
    { number: 1, title: t("donation.flow.amount") },
    { number: 2, title: t("donation.flow.donorDetails") },
    { number: 3, title: t("donation.flow.review") },
    { number: 4, title: t("donation.flow.payment") },
    { number: 5, title: t("donation.flow.success") },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-8">
      {/* Progress Steps */}
      {currentStep < 5 && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.slice(0, 4).map((step) => (
              <div key={step.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                      currentStep >= step.number
                        ? "bg-amber-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {currentStep > step.number ? "✓" : step.number}
                  </div>
                  <p className="text-xs mt-2 text-center text-gray-600 hidden sm:block">
                    {step.title}
                  </p>
                </div>
                {step.number < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      currentStep > step.number ? "bg-amber-600" : "bg-gray-200"
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step Content */}
      <div>
        {currentStep === 1 && (
          <Step1AmountSelection
            data={donationData}
            updateData={updateData}
            nextStep={nextStep}
          />
        )}
        {currentStep === 2 && (
          <Step2DonorDetails
            data={donationData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 3 && (
          <Step3Review
            data={donationData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 4 && (
          <Step4Payment
            data={donationData}
            updateData={updateData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        )}
        {currentStep === 5 && (
          <Step5Success data={donationData} resetFlow={resetFlow} />
        )}
      </div>
    </div>
  );
};

export default DonationFlow;
