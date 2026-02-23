import { useState, useCallback } from "react";
import PrimaryButton from "../../../components/PrimaryButton";
import { formatCurrency } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useTranslation } from "react-i18next";

/**
 * Step4Payment - Handles payment processing
 *
 * This is the ONLY step that makes backend API calls:
 * 1. POST /donations/create - Creates donation record, returns donationId
 * 2. POST /donations/create-order - Creates Razorpay order, returns razorpayOrderId
 * 3. Opens Razorpay Checkout
 *
 * SECURITY RULES:
 * - Frontend NEVER marks donation as SUCCESS
 * - Webhook is the only authority for success/failure
 * - On Razorpay success callback → navigate to Step5Success
 * - On dismiss → allow retry
 */
const Step4Payment = ({ data, updateData, nextStep, prevStep }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paymentStage, setPaymentStage] = useState("idle"); // idle | creating | ordering | checkout
  const { t } = useTranslation();

  /**
   * Get JWT token from localStorage
   * Auth is PAUSED but we still send token if available
   */
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  /**
   * Make authenticated API request
   */
  const localApiRequest = async (endpoint, body) => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data;
  };

  /**
   * Step 1: Create donation record in backend
   * Sends full donor snapshot and donationHead object
   */
  const createDonation = async () => {
    // Build donor object with all details from Step2
    const donor = {
      name: data.name,
      mobile: data.mobile,
      email: data.email || undefined,
      emailOptIn: data.emailOptIn || false,
      emailVerified: data.emailVerified || false,
      address: data.address,
      anonymousDisplay: data.anonymousDisplay || false,
      dob: data.dateOfBirth, // YYYY-MM-DD format
      idType: "PAN",
      idNumber: data.pan,
    };

    // Validate donationHead exists before proceeding
    if (
      !data.donationHead ||
      (!data.donationHead._id && !data.donationHead.id) ||
      !data.donationHead.name
    ) {
      throw new Error(t("donation.step4.selectCauseFirst"));
    }

    // Build donationHead object (not just ID)
    const donationHead = {
      id: String(data.donationHead._id || data.donationHead.id),
      name: data.donationHead.name,
    };

    const payload = {
      donor,
      donationHead,
      amount: data.amount,
      // Include referral code if present (from URL params)
      ...(data.referralCode && { referralCode: data.referralCode }),
    };

    const result = await localApiRequest("/donations/create", payload);
    return result.donationId;
  };

  /**
   * Step 2: Create Razorpay order
   */
  const createOrder = async (donationId) => {
    const result = await localApiRequest("/donations/create-order", {
      donationId,
    });
    return result;
  };

  /**
   * Step 3: Open Razorpay Checkout
   */
  const openRazorpayCheckout = useCallback(
    (orderData) => {
      return new Promise((resolve, reject) => {
        // Ensure Razorpay script is loaded - critical safety check
        if (typeof window.Razorpay !== "function") {
          reject(new Error(t("donation.step4.razorpaySdkError")));
          return;
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount, // Backend already provides amount in paise - DO NOT multiply
          currency: orderData.currency,
          order_id: orderData.razorpayOrderId,
          name: "Shri Gurudev Ashram",
          description: `Donation for ${data.donationHead?.name || "Seva"}`,
          prefill: {
            name: data.name,
            email: data.email || undefined,
            contact: data.mobile,
          },
          theme: {
            color: "#d97706", // amber-600
          },
          handler: function (response) {
            // Payment successful callback from Razorpay
            // NOTE: This does NOT mean the donation is confirmed
            // Webhook will handle actual confirmation
            resolve({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              // User closed the checkout without completing payment
              reject(new Error(t("donation.step4.cancelled")));
            },
            escape: true,
            backdropclose: false,
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response) {
          reject(
            new Error(
              response.error?.description || t("donation.step4.failed"),
            ),
          );
        });

        rzp.open();
      });
    },
    [data.donationHead?.id, data.name, data.email, data.mobile],
  );

  /**
   * Main payment handler - orchestrates the entire payment flow
   */
  const handlePayment = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Stage 1: Create donation
      setPaymentStage("creating");
      let donationId = data.donationId;

      // Only create donation if we don't have one yet (supports retry)
      if (!donationId) {
        donationId = await createDonation();
        updateData({ donationId });
      }

      // Stage 2: Create Razorpay order
      setPaymentStage("ordering");
      let orderData;

      // If we already have an order, we can skip this (supports retry)
      if (!data.razorpayOrderId) {
        orderData = await createOrder(donationId);
        // Store all order data for potential retry - amount is already in paise from backend
        updateData({
          razorpayOrderId: orderData.razorpayOrderId,
          razorpayOrderAmount: orderData.amount, // Store backend amount (in paise) for retry
          razorpayKey: orderData.key,
        });
      } else {
        // Use stored order data for retry - amount already in paise
        orderData = {
          razorpayOrderId: data.razorpayOrderId,
          amount: data.razorpayOrderAmount, // Use stored backend amount
          currency: "INR",
          key: data.razorpayKey || import.meta.env.VITE_RAZORPAY_KEY_ID,
        };
      }

      // Stage 3: Open Razorpay checkout
      setPaymentStage("checkout");
      const paymentResult = await openRazorpayCheckout(orderData);

      // IMPORTANT: Do NOT verify payment here!
      // Webhook is the ONLY authority to mark payment as SUCCESS/FAILED
      // Frontend just stores the payment ID and navigates to Step5Success
      // Step5Success will poll the donation status until webhook updates it

      // Store payment details for reference (actual confirmation comes from webhook)
      updateData({
        razorpayPaymentId: paymentResult.razorpayPaymentId,
        transactionId: paymentResult.razorpayPaymentId,
      });

      // Navigate to success page - it will poll for actual status
      nextStep();
    } catch (err) {
      setError(err.message);
      setPaymentStage("idle");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Get user-friendly stage message
   */
  const getStageMessage = () => {
    switch (paymentStage) {
      case "creating":
        return t("donation.step4.creating");
      case "ordering":
        return t("donation.step4.preparing");
      case "checkout":
        return t("donation.step4.opening");
      default:
        return t("donation.step4.processing");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        {t("donation.step4.payment")}
      </h2>

      {/* Order Summary */}
      <div className="bg-amber-50 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-amber-900 mb-4">
          {t("donation.step4.donationSummary")}
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">
              {t("donation.step4.donationHead")}
            </span>
            <span className="font-semibold text-amber-900">
              {data.donationHead?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">
              {t("donation.step4.donorName")}
            </span>
            <span className="font-semibold text-amber-900">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">{t("donation.step4.mobile")}</span>
            <span className="font-semibold text-amber-900">{data.mobile}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-amber-900">
                {t("donation.step4.totalAmount")}
              </span>
              <span className="text-2xl font-bold text-amber-700">
                {formatCurrency(data.amount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <svg
              className="w-5 h-5 text-red-500 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-red-700 font-medium">
                {t("donation.step4.payError")}
              </p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <svg
              className="animate-spin h-5 w-5 text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-amber-700">{getStageMessage()}</span>
          </div>
        </div>
      )}

      {/* Payment Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <svg
            className="w-5 h-5 text-gray-500 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <p className="text-gray-700 text-sm font-medium">
              {t("donation.step4.securePayment")}
            </p>
            <p className="text-gray-500 text-xs">
              {t("donation.step4.paymentNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <PrimaryButton
          type="button"
          onClick={prevStep}
          variant="outline"
          className="flex-1"
          disabled={isProcessing || paymentStage === "checkout"}
        >
          {t("donation.step4.back")}
        </PrimaryButton>
        <PrimaryButton
          onClick={handlePayment}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing
            ? getStageMessage()
            : t("donation.step4.payAmount", {
                amount: formatCurrency(data.amount),
              })}
        </PrimaryButton>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        {t("donation.step4.secureNote")}
      </p>
    </div>
  );
};

export default Step4Payment;
