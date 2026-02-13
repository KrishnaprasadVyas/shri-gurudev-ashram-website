import SectionHeading from "../components/SectionHeading";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { validateEmail } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  // Step: 1 = Enter mobile, 2 = Enter OTP + Profile
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    address: "",
    whatsapp: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const fullMobile = `+91${mobile}`;

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (mobile.length !== 10) {
      setError(t("signup.validMobile"));
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

      setSuccessMessage(t("signup.otpSent"));
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and complete profile
  const handleVerifyAndComplete = async (e) => {
    e.preventDefault();

    // Validate profile fields
    const newErrors = {};
    if (!profile.fullName.trim())
      newErrors.fullName = t("signup.fullNameRequired");
    if (!profile.address.trim())
      newErrors.address = t("signup.addressRequired");
    if (profile.email && !validateEmail(profile.email)) {
      newErrors.email = t("signup.emailInvalid");
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    if (otp.length !== 6) {
      setError(t("signup.validOtp"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify OTP and login
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
      await login(data.token);

      // Update user profile
      const updateResponse = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.token}`,
        },
        body: JSON.stringify(profile),
      });

      if (!updateResponse.ok) {
        console.error("Failed to update profile");
      }

      // Redirect to home
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setMobile(value);
    setError("");
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setError("");
  };

  const handleResendOtp = async () => {
    setOtp("");
    setError("");
    await handleSendOtp({ preventDefault: () => {} });
  };

  return (
    <section className="py-16 px-4 bg-white min-h-[60vh]">
      <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-lg shadow-sm p-6">
        <SectionHeading
          title={
            step === 1 ? t("signup.createAccount") : t("signup.completeProfile")
          }
          subtitle={
            step === 1 ? t("signup.enterMobile") : t("signup.enterOtpProfile")
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
          {/* Step 1: Mobile Number Entry */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  {t("signup.mobileNumber")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="w-20 px-3 py-2 border border-amber-200 rounded-md bg-gray-50 flex items-center justify-center font-medium text-gray-700">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={mobile}
                    onChange={handleMobileChange}
                    placeholder={t("signup.mobilePlaceholder")}
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || mobile.length !== 10}
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
                    {t("signup.sendingOtp")}
                  </>
                ) : (
                  t("signup.sendOtp")
                )}
              </button>

              <p className="text-sm text-center text-gray-600">
                {t("signup.alreadyHaveAccount")}{" "}
                <Link
                  to="/login"
                  className="text-amber-600 hover:text-amber-700 font-medium"
                >
                  {t("signup.loginLink")}
                </Link>
              </p>
            </form>
          )}

          {/* Step 2: OTP + Profile Form */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndComplete} className="space-y-4">
              {/* OTP Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold text-gray-800">
                    {t("signup.enterOtp")}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                      setError("");
                      setSuccessMessage("");
                    }}
                    className="text-sm text-amber-600 hover:text-amber-700"
                  >
                    {t("signup.changeNumber")}
                  </button>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {t("signup.sentTo", { phone: fullMobile })}
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={handleOtpChange}
                  placeholder={t("signup.enterOtpPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-3 py-3 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest font-mono disabled:opacity-50"
                  maxLength={6}
                  autoFocus
                />
                <div className="mt-2 text-center">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sm text-amber-600 hover:text-amber-700 disabled:opacity-50"
                  >
                    {t("signup.resendOtp")}
                  </button>
                </div>
              </div>

              <hr className="border-amber-200" />

              {/* Profile Fields */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {t("signup.fullName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleProfileChange}
                  placeholder={t("signup.fullNamePlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    errors.fullName
                      ? "border-red-300 focus:ring-red-500"
                      : "border-amber-200 focus:ring-amber-500"
                  }`}
                />
                {errors.fullName && (
                  <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {t("signup.address")} <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="address"
                  value={profile.address}
                  onChange={handleProfileChange}
                  placeholder={t("signup.addressPlaceholder")}
                  rows={3}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    errors.address
                      ? "border-red-300 focus:ring-red-500"
                      : "border-amber-200 focus:ring-amber-500"
                  }`}
                />
                {errors.address && (
                  <p className="mt-1 text-xs text-red-600">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {t("signup.emailOptional")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleProfileChange}
                  placeholder={t("signup.emailPlaceholder")}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-500"
                      : "border-amber-200 focus:ring-amber-500"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {t("signup.emailNote")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  {t("signup.whatsappOptional")}
                </label>
                <input
                  type="tel"
                  name="whatsapp"
                  value={profile.whatsapp}
                  onChange={handleProfileChange}
                  placeholder={t("signup.whatsappPlaceholder")}
                  disabled={isLoading}
                  className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
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
                    {t("signup.creatingAccount")}
                  </>
                ) : (
                  t("signup.completeSignup")
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Signup;
