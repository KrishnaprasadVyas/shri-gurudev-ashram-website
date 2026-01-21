import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Email Verification Page
 *
 * Handles the email verification flow when user clicks the verification link.
 * Route: /verify-email?token=...
 */
const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("verifying"); // 'verifying' | 'success' | 'error' | 'expired'
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link");
      return;
    }

    // Call backend to verify the token
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const result = await response.json();

        if (response.ok) {
          setStatus("success");
          setEmail(result.email || "");
        } else {
          if (result.expired) {
            setStatus("expired");
          } else {
            setStatus("error");
          }
          setErrorMessage(result.message || "Verification failed");
        }
      } catch (err) {
        setStatus("error");
        setErrorMessage("Network error. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="min-h-[70vh] bg-amber-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white border border-amber-100 rounded-2xl shadow-lg p-8 text-center">
        {/* Verifying State */}
        {status === "verifying" && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="animate-spin w-8 h-8 text-amber-600"
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
            <h1 className="text-2xl font-bold text-amber-900 mb-2">
              Verifying Email...
            </h1>
            <p className="text-gray-600">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {/* Success State */}
        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
            <h1 className="text-2xl font-bold text-green-800 mb-2">
              Email Verified!
            </h1>
            <p className="text-gray-600 mb-2">
              Your email address has been successfully verified.
            </p>
            {email && (
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium">{email}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              You will now receive donation receipts at this email address.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">Back to Home</PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>Make a Donation</PrimaryButton>
              </Link>
            </div>
          </>
        )}

        {/* Expired State */}
        {status === "expired" && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-amber-900 mb-2">
              Link Expired
            </h1>
            <p className="text-gray-600 mb-6">
              This verification link has expired. Please request a new
              verification email during your next donation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">Back to Home</PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>Make a Donation</PrimaryButton>
              </Link>
            </div>
          </>
        )}

        {/* Error State */}
        {status === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-red-600"
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
            <h1 className="text-2xl font-bold text-red-900 mb-2">
              Verification Failed
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMessage ||
                "Unable to verify email. The link may be invalid or already used."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">Back to Home</PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>Make a Donation</PrimaryButton>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
