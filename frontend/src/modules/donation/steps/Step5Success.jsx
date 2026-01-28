import { Link } from "react-router-dom";
import PrimaryButton from "../../../components/PrimaryButton";
import { formatCurrency } from "../../../utils/helpers";
import { useDonations } from "../../../context/DonationsContext";
import { useEffect, useRef, useState, useCallback } from "react";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";

const POLL_INTERVAL = 4000; // 4 seconds
const MAX_POLL_TIME = 30000; // 30 seconds

const Step5Success = ({ data, resetFlow }) => {
  const { addDonation } = useDonations();
  const hasSavedRef = useRef(false);
  const pollIntervalRef = useRef(null);
  const pollStartTimeRef = useRef(null);

  const [paymentStatus, setPaymentStatus] = useState("PENDING");
  const [isPolling, setIsPolling] = useState(true);
  const [receiptAvailable, setReceiptAvailable] = useState(false);

  /**
   * Get JWT token from localStorage
   */
  const getAuthToken = () => localStorage.getItem("token");

  /**
   * Poll donation status from backend
   */
  const pollStatus = useCallback(async () => {
    if (!data.donationId) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/donations/${data.donationId}/status`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      if (response.ok) {
        const result = await parseJsonResponse(response);
        setPaymentStatus(result.status);

        // Stop polling on terminal states
        if (result.status === "SUCCESS" || result.status === "FAILED") {
          setIsPolling(false);
          if (result.status === "SUCCESS") {
            setReceiptAvailable(true);
          }
        }
      }
    } catch (err) {
      // Silent fail - continue polling
    }
  }, [data.donationId]);

  /**
   * Start polling on mount
   */
  useEffect(() => {
    if (!data.donationId) {
      setIsPolling(false);
      return;
    }

    pollStartTimeRef.current = Date.now();

    // Initial poll
    pollStatus();

    // Set up interval
    pollIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - pollStartTimeRef.current;

      if (elapsed >= MAX_POLL_TIME) {
        // Stop polling after max time
        setIsPolling(false);
        clearInterval(pollIntervalRef.current);
        return;
      }

      pollStatus();
    }, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [data.donationId, pollStatus]);

  /**
   * Stop polling when status is terminal
   */
  useEffect(() => {
    if (!isPolling && pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  }, [isPolling]);

  // Save donation when confirmed (only once)
  useEffect(() => {
    if (
      !hasSavedRef.current &&
      paymentStatus === "SUCCESS" &&
      data.amount > 0
    ) {
      addDonation(data);
      hasSavedRef.current = true;
    }
  }, [paymentStatus, data, addDonation]);

  /**
   * Download receipt from backend
   */
  const handleDownloadReceipt = async () => {
    if (!data.donationId) return;

    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/donations/${data.donationId}/receipt`,
        {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${data.donationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Receipt not available yet. Please try again later.");
      }
    } catch (err) {
      alert("Failed to download receipt. Please try again.");
    }
  };

  /**
   * Render status indicator
   */
  const renderStatusIndicator = () => {
    if (paymentStatus === "SUCCESS") {
      return (
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-amber-900 mb-2">
            Donation Confirmed!
          </h2>
          <p className="text-gray-600">
            Thank you for your generous contribution
          </p>
        </div>
      );
    }

    if (paymentStatus === "FAILED") {
      return (
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-red-900 mb-2">
            Payment Failed
          </h2>
          <p className="text-gray-600">
            Your payment could not be processed. You can try again.
          </p>
        </div>
      );
    }

    // PENDING state
    return (
      <div className="mb-6">
        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="animate-spin w-10 h-10 text-amber-600"
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
        </div>
        <h2 className="text-3xl font-bold text-amber-900 mb-2">
          Processing Payment...
        </h2>
        <p className="text-gray-600">
          Please wait while we confirm your payment
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      {renderStatusIndicator()}

      <div className="bg-amber-50 rounded-lg p-6 mb-6">
        <h3 className="font-bold text-amber-900 mb-4">Donation Details</h3>
        <div className="space-y-2 text-sm text-left">
          <div className="flex justify-between">
            <span className="text-gray-700">Transaction ID:</span>
            <span className="font-semibold text-amber-900 font-mono">
              {data.transactionId || data.razorpayPaymentId || "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Donation Head:</span>
            <span className="font-semibold text-amber-900">
              {data.donationHead?.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Amount:</span>
            <span className="font-bold text-amber-700 text-lg">
              {formatCurrency(data.amount)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Date:</span>
            <span className="font-semibold text-amber-900">
              {new Date().toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Status:</span>
            <span
              className={`font-semibold ${
                paymentStatus === "SUCCESS"
                  ? "text-green-600"
                  : paymentStatus === "FAILED"
                    ? "text-red-600"
                    : "text-amber-600"
              }`}
            >
              {paymentStatus === "SUCCESS"
                ? "Confirmed"
                : paymentStatus === "FAILED"
                  ? "Failed"
                  : "Processing..."}
            </span>
          </div>
        </div>
      </div>

      {paymentStatus === "SUCCESS" && (
        <div className="space-y-3 mb-6">
          <PrimaryButton
            onClick={handleDownloadReceipt}
            className="w-full"
            disabled={!receiptAvailable}
          >
            {receiptAvailable ? "Download Receipt" : "Receipt Generating..."}
          </PrimaryButton>

          {/* Receipt Delivery Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            {data.emailOptIn && data.emailVerified ? (
              <div className="flex items-center space-x-2 text-sm text-green-700">
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
                <span>Receipt will be sent to your verified email</span>
              </div>
            ) : data.emailOptIn && !data.emailVerified ? (
              <div className="flex items-start space-x-2 text-sm text-amber-700">
                <svg
                  className="w-5 h-5 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <span className="font-medium">Email not verified</span>
                  <p className="text-xs mt-1">
                    Verify your email in future donations to receive receipts
                    automatically.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-sm text-amber-700">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Receipt available for download</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Link to="/" className="flex-1">
          <PrimaryButton variant="outline" className="w-full">
            Back to Home
          </PrimaryButton>
        </Link>
        <PrimaryButton onClick={resetFlow} className="flex-1">
          {paymentStatus === "FAILED" ? "Try Again" : "Make Another Donation"}
        </PrimaryButton>
      </div>

      <p className="text-sm text-gray-600 mt-6">
        {paymentStatus === "SUCCESS" ? (
          <>
            Thank you for your generous contribution.
            <br />
            May you be blessed with peace, prosperity, and spiritual growth!
          </>
        ) : paymentStatus === "FAILED" ? (
          <>
            If money was deducted, it will be refunded within 5-7 business days.
          </>
        ) : (
          <>Please do not close this page. We are confirming your payment.</>
        )}
      </p>
    </div>
  );
};

export default Step5Success;
