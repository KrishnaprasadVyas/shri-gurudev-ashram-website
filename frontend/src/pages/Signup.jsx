/**
 * Signup Page - Firebase Phone Authentication
 * Note: This page redirects to Login for phone verification,
 * then allows profile completion after authentication.
 */

import SectionHeading from "../components/SectionHeading";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { validateEmail } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { signInWithPhoneNumber } from "firebase/auth";
import { auth } from "../firebase";
import { cleanupRecaptcha, resetRecaptcha, setupRecaptcha } from "../services/recaptcha";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";

const Signup = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [step, setStep] = useState("phone");
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
  const [errors, setErrors] = useState({});

  const fullMobile = `+91${mobile}`;

  useEffect(() => {
    return cleanupRecaptcha;
  }, []);

  const sendOTP = async (phone) => {
    const appVerifier = await setupRecaptcha(auth, "recaptcha-container");
    try {
      const confirmation = await signInWithPhoneNumber(auth, phone, appVerifier);
      window.confirmationResult = confirmation;
    } catch (err) {
      resetRecaptcha();
      throw err;
    }
  };

  const getOtpErrorMessage = (err) => {
    if (err?.code === "auth/invalid-app-credential") {
      return "Phone auth is blocked for this origin. Verify Firebase Auth authorized domain and API key restrictions.";
    }
    return err?.message || "Failed to send OTP. Please try again.";
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (mobile.length !== 10) {
      setError(t("signup.validMobile"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await sendOTP(fullMobile);
      setStep("otp");
    } catch (err) {
      setError(getOtpErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      setError("Enter the OTP");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;
      const token = await user.getIdToken();

      const response = await fetch(
        `${API_BASE_URL}/auth/verify-firebase-token`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );

      const data = await parseJsonResponse(response);
      setStep("profile");
      login(data.token, data.user);
    } catch (err) {
      console.error(err);
      setError("Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();

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

    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("authToken");
      await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to update profile.");
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

  return (
    <section className="py-16 px-4 bg-white min-h-[60vh]">
      <div className="max-w-md mx-auto bg-amber-50 border border-amber-200 rounded-lg shadow-sm p-6">
        <SectionHeading
          title={t("signup.createAccount")}
          subtitle={
            step === "phone"
              ? t("signup.enterMobile")
              : step === "otp"
                ? "Enter the OTP sent to your phone"
                : "Complete your profile"
          }
          center={true}
        />

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {step === "phone" && (
            <form onSubmit={handleSendOTP} className="space-y-4">
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
              <div id="recaptcha-container" />
              <button
                type="submit"
                disabled={isLoading || mobile.length !== 10}
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                {isLoading ? t("signup.sendingOtp") : t("signup.sendOtp")}
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

          {step === "otp" && (
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-800">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="w-full px-3 py-2 border border-amber-200 rounded-md"
              />
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading}
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700"
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
          )}

          {step === "profile" && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
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
                className="w-full py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 disabled:opacity-50"
              >
                {isLoading ? t("signup.creatingAccount") : t("signup.completeSignup")}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default Signup;
