import { useState, useCallback } from "react";
import PrimaryButton from "../../../components/PrimaryButton";
import { formatCurrency } from "../../../utils/helpers";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  const apiRequest = async (endpoint, body) => {
    const token = getAuthToken();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status}`);
    }

    return response.json();
  };

  /**
   * Step 1: Create donation record in backend
   */
  const createDonation = async () => {
    // Map local field names to API expected format
    const donorIdType = data.govtIdType === "aadhaar" ? "AADHAAR" : "PAN";
    const donorIdNumber =
      data.govtIdType === "aadhaar" ? data.aadhaar : data.pan;

    // Use id if available for consistent backend mapping, otherwise fallback to name
    const donationHeadValue =
      data.donationHead?.id || data.donationHead?.name || data.donationHead;

    const payload = {
      donationHead: donationHeadValue,
      amount: data.amount,
      donorDob: data.dateOfBirth, // YYYY-MM-DD format
      donorIdType,
      donorIdNumber,
    };

    const result = await apiRequest("/donations/create", payload);
    return result.donationId;
  };

  /**
   * Step 2: Create Razorpay order
   */
  const createOrder = async (donationId) => {
    const result = await apiRequest("/donations/create-order", { donationId });
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
          reject(
            new Error(
              "Razorpay SDK not loaded. Please refresh the page and try again.",
            ),
          );
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
              reject(new Error("Payment cancelled. You can try again."));
            },
            escape: true,
            backdropclose: false,
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response) {
          reject(
            new Error(
              response.error?.description ||
                "Payment failed. Please try again.",
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

      // Payment callback received - update state and proceed
      // NOTE: We're NOT marking as success - webhook handles that
      updateData({
        razorpayPaymentId: paymentResult.razorpayPaymentId,
        transactionId: paymentResult.razorpayPaymentId, // For backward compatibility with Step5Success
      });

      // Navigate to success page
      // The actual success/failure will be determined by webhook
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
        return "Creating donation record...";
      case "ordering":
        return "Preparing payment...";
      case "checkout":
        return "Opening payment gateway...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        Payment
      </h2>

      {/* Order Summary */}
      <div className="bg-amber-50 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-amber-900 mb-4">Donation Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-700">Donation Head:</span>
            <span className="font-semibold text-amber-900">
              {data.donationHead?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Donor Name:</span>
            <span className="font-semibold text-amber-900">{data.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Mobile:</span>
            <span className="font-semibold text-amber-900">{data.mobile}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="text-lg font-bold text-amber-900">
                Total Amount:
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
              <p className="text-red-700 font-medium">Payment Error</p>
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
            <p className="text-gray-700 text-sm font-medium">Secure Payment</p>
            <p className="text-gray-500 text-xs">
              You will be redirected to Razorpay&apos;s secure payment gateway
              to complete your donation. All payment methods (UPI, Cards, Net
              Banking, Wallets) are supported.
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
          Back
        </PrimaryButton>
        <PrimaryButton
          onClick={handlePayment}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing
            ? getStageMessage()
            : `Pay ${formatCurrency(data.amount)}`}
        </PrimaryButton>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        Your payment is secure and encrypted. We use Razorpay for secure payment
        processing.
      </p>
    </div>
  );
};

export default Step4Payment;
