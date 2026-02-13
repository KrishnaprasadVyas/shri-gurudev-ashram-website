import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SectionHeading from "../components/SectionHeading";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";

const COUNTRY_OPTIONS = [
  { value: "IN", label: "India", dialCode: "+91", length: 10 },
  { value: "US", label: "United States", dialCode: "+1", length: 10 },
  { value: "CA", label: "Canada", dialCode: "+1", length: 10 },
  { value: "GB", label: "United Kingdom", dialCode: "+44", length: 10 },
  { value: "AU", label: "Australia", dialCode: "+61", length: 9 },
  { value: "JP", label: "Japan", dialCode: "+81", length: 10 },
  { value: "AE", label: "United Arab Emirates", dialCode: "+971", length: 9 },
  { value: "DE", label: "Germany", dialCode: "+49", length: 11 },
  { value: "FR", label: "France", dialCode: "+33", length: 9 },
  { value: "SG", label: "Singapore", dialCode: "+65", length: 8 },
];

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getRedirectPath } = useAuth();
  const { t } = useTranslation();

  // Form state
  const [step, setStep] = useState(1); // 1: Enter Phone, 2: Enter OTP
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Get return URL if user was redirected here
  const returnUrl = location.state?.from || null;

  const fullMobile = `${country.dialCode}${phone}`;

  const handleCountryChange = (event) => {
    const selected = COUNTRY_OPTIONS.find(
      (opt) => opt.value === event.target.value,
    );
    if (selected) {
      setCountry(selected);
      setPhone("");
    }
  };

  const handlePhoneChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setPhone(digitsOnly.slice(0, country.length));
    setError("");
  };

  const handleOtpChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, "");
    setOtp(digitsOnly.slice(0, 6));
    setError("");
  };

  /**
   * Step 1: Send OTP to phone number
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (phone.length !== country.length) {
      setError(t("login.validPhone", { length: country.length }));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setSuccessMessage(t("login.otpSent"));
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Verify OTP and login
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(t("login.validOtp"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile, otp }),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP");
      }

      // Login with token
      const user = await login(data.token);

      if (user) {
        // Redirect based on role or return URL
        const redirectPath = returnUrl || getRedirectPath(user.role);
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to phone entry step
   */
  const handleBack = () => {
    setStep(1);
    setOtp("");
    setError("");
    setSuccessMessage("");
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    setOtp("");
    setError("");
    await handleSendOtp({ preventDefault: () => {} });
  };

  return (
    <section className="py-16 px-4 bg-white min-h-[60vh]">
      <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-lg shadow-sm p-6">
        <SectionHeading
          title={t("login.title")}
          subtitle={
            step === 1 ? t("login.enterPhone") : t("login.enterOtpSubtitle")
          }
          center={true}
        />

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {successMessage && step === 2 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {successMessage}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {/* Step 1: Phone Number Entry */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t("login.phoneNumber")}
                </label>
                <div className="flex gap-2">
                  <select
                    value={country.value}
                    onChange={handleCountryChange}
                    disabled={isLoading}
                    className="w-36 px-2 py-2 border border-amber-200 rounded-md bg-white text-sm text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%23666' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 8px center",
                      paddingRight: "26px",
                    }}
                  >
                    {COUNTRY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} ({opt.dialCode})
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder={`${country.length}-digit number`}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length !== country.length}
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("login.sendingOtp")}
                  </>
                ) : (
                  t("login.sendOtp")
                )}
              </button>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">
                    {t("login.enterOtp")}
                  </label>
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    {t("login.changeNumber")}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {t("login.sentTo", { phone: fullMobile })}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder={t("login.enterOtpPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest font-mono disabled:opacity-50"
                  maxLength={6}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {t("login.verifying")}
                  </>
                ) : (
                  t("login.verifyLogin")
                )}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-50"
                >
                  {t("login.resendOtp")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Login;
