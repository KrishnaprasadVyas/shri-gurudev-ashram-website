import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import PrimaryButton from "../components/PrimaryButton";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setErrorMessage(t("verifyEmail.invalidLink"));
      return;
    }

    // Call backend to verify the token
    const verifyToken = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`,
        );
        const result = await parseJsonResponse(response);

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
        setErrorMessage(t("verifyEmail.networkError"));
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
              {t("verifyEmail.verifying")}
            </h1>
            <p className="text-gray-600">{t("verifyEmail.verifyingNote")}</p>
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
              {t("verifyEmail.verified")}
            </h1>
            <p className="text-gray-600 mb-2">
              {t("verifyEmail.verifiedNote")}
            </p>
            {email && (
              <p className="text-sm text-gray-500 mb-6">
                <span className="font-medium">{email}</span>
              </p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {t("verifyEmail.receiptNote")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">
                  {t("verifyEmail.backToHome")}
                </PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>{t("verifyEmail.makeDonation")}</PrimaryButton>
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
              {t("verifyEmail.expired")}
            </h1>
            <p className="text-gray-600 mb-6">{t("verifyEmail.expiredNote")}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">
                  {t("verifyEmail.backToHome")}
                </PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>{t("verifyEmail.makeDonation")}</PrimaryButton>
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
              {t("verifyEmail.failed")}
            </h1>
            <p className="text-gray-600 mb-6">
              {errorMessage || t("verifyEmail.failedNote")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/">
                <PrimaryButton variant="outline">
                  {t("verifyEmail.backToHome")}
                </PrimaryButton>
              </Link>
              <Link to="/donate">
                <PrimaryButton>{t("verifyEmail.makeDonation")}</PrimaryButton>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
