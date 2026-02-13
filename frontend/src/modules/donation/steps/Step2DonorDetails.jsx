import { useState } from "react";
import FormInput from "../../../components/FormInput";
import PrimaryButton from "../../../components/PrimaryButton";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useTranslation } from "react-i18next";

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

const Step2DonorDetails = ({ data, updateData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);

  // OTP state
  const [otpStep, setOtpStep] = useState("form"); // 'form' | 'otp'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const { t } = useTranslation();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "anonymousDisplay") {
        updateData({ anonymousDisplay: checked });
      }
    } else {
      updateData({ [name]: value });
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }
    }
  };

  const validatePAN = (pan) => {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan);
  };

  const handlePanChange = (e) => {
    const value = e.target.value
      .replace(/[^A-Z0-9]/gi, "")
      .slice(0, 10)
      .toUpperCase();
    updateData({ pan: value });
    if (errors.pan) {
      setErrors((prev) => ({ ...prev, pan: "" }));
    }
  };

  const handleDOBChange = (e) => {
    updateData({ dateOfBirth: e.target.value });
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  /**
   * Validate form and send OTP
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Full Name
    if (!data.name.trim()) {
      newErrors.name = t("donation.step2.nameRequired");
    }

    // Mobile Number
    if (!data.mobile.trim()) {
      newErrors.mobile = t("donation.step2.mobileRequired");
    } else if (data.mobile.length !== country.length) {
      newErrors.mobile = t("donation.step2.mobileDigitInvalid", {
        length: country.length,
      });
    }

    // Address
    if (!data.address.trim()) {
      newErrors.address = t("donation.step2.addressRequired");
    }

    // PAN Number (mandatory)
    if (!data.pan || data.pan.length !== 10) {
      newErrors.pan = t("donation.step2.panLengthInvalid");
    } else if (!validatePAN(data.pan)) {
      newErrors.pan = t("donation.step2.panInvalid");
    }

    // DOB
    if (!data.dateOfBirth) {
      newErrors.dateOfBirth = t("donation.step2.dobRequired");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Send OTP
    setIsLoading(true);
    setOtpError("");

    const fullMobile = `${country.dialCode}${data.mobile}`;

    try {
      const response = await fetch(`${API_BASE_URL}/donations/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile }),
      });

      const result = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Failed to send OTP");
      }

      setOtpSent(true);
      setOtpStep("otp");
    } catch (err) {
      setOtpError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verify OTP and proceed
   */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setOtpError(t("donation.step2.otpRequired"));
      return;
    }

    setIsLoading(true);
    setOtpError("");

    const fullMobile = `${country.dialCode}${data.mobile}`;

    try {
      const response = await fetch(`${API_BASE_URL}/donations/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile, otp }),
      });

      const result = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Invalid OTP");
      }

      // Mark OTP as verified and proceed
      updateData({ otpVerified: true });
      nextStep();
    } catch (err) {
      setOtpError(err.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resend OTP
   */
  const handleResendOtp = async () => {
    setOtp("");
    setOtpError("");
    setIsLoading(true);

    const fullMobile = `${country.dialCode}${data.mobile}`;

    try {
      const response = await fetch(`${API_BASE_URL}/donations/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: fullMobile }),
      });

      const result = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Failed to resend OTP");
      }

      setOtpError("");
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Go back to form
   */
  const handleBackToForm = () => {
    setOtpStep("form");
    setOtp("");
    setOtpError("");
  };

  // OTP Verification Screen
  if (otpStep === "otp") {
    return (
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-amber-900 mb-2 text-center">
          {t("donation.step2.verifyMobile")}
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {t("donation.step2.otpSentTo", {
            phone: `${country.dialCode} ${data.mobile}`,
          })}
        </p>

        {otpError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {otpError}
          </div>
        )}

        {otpSent && !otpError && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            {t("donation.step2.otpSentSuccess")}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("donation.step2.enterOtp")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtp(value);
                setOtpError("");
              }}
              placeholder={t("donation.step2.enterOtpPlaceholder")}
              disabled={isLoading}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl tracking-widest font-mono disabled:opacity-50"
              maxLength={6}
              autoFocus
            />
          </div>

          <PrimaryButton
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="w-full"
          >
            {isLoading
              ? t("donation.step2.verifying")
              : t("donation.step2.verifyAndContinue")}
          </PrimaryButton>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={handleBackToForm}
              className="text-amber-600 hover:text-amber-700"
            >
              {t("donation.step2.changeDetails")}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              {t("donation.step2.resendOtp")}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Main Form
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        {t("donation.step2.donorDetails")}
      </h2>

      {otpError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {otpError}
        </div>
      )}

      <form onSubmit={handleSendOtp} className="space-y-4">
        {/* Full Name (required) */}
        <FormInput
          label={t("donation.step2.fullName")}
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder={t("donation.step2.namePlaceholder")}
          required
          error={errors.name}
        />

        {/* Mobile Number with Country Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("donation.step2.country")}
          </label>
          <select
            value={country.value}
            onChange={(e) => {
              const selected = COUNTRY_OPTIONS.find(
                (opt) => opt.value === e.target.value,
              );
              if (selected) {
                setCountry(selected);
                updateData({ mobile: "" });
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white mb-3"
          >
            {COUNTRY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.dialCode})
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("donation.step2.mobileNumber")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-4 py-3 border border-r-0 border-gray-300 bg-gray-100 text-gray-700 rounded-l-lg font-medium">
              {country.dialCode}
            </span>
            <input
              type="tel"
              value={data.mobile}
              onChange={(e) => {
                const mobile = e.target.value
                  .replace(/\D/g, "")
                  .slice(0, country.length);
                updateData({ mobile });
                if (errors.mobile) {
                  setErrors((prev) => ({ ...prev, mobile: "" }));
                }
              }}
              placeholder={t("donation.step2.digitPlaceholder", {
                length: country.length,
              })}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>

        {/* Address (required) */}
        <FormInput
          label={t("donation.step2.address")}
          name="address"
          value={data.address}
          onChange={handleChange}
          placeholder={t("donation.step2.addressPlaceholder")}
          required
          error={errors.address}
        />

        {/* PAN Number (Mandatory) */}
        <div className="space-y-3">
          <FormInput
            label={t("donation.step2.panNumber")}
            type="text"
            name="pan"
            value={data.pan}
            onChange={handlePanChange}
            placeholder={t("donation.step2.panPlaceholder")}
            required
            error={errors.pan}
            maxLength={10}
          />

          {/* Helper Text for PAN */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-700">
              {t("donation.step2.panNote")}
            </p>
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("donation.step2.dateOfBirth")}{" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={data.dateOfBirth}
            onChange={handleDOBChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
              errors.dateOfBirth
                ? "border-red-300 focus:ring-red-500"
                : "border-gray-300 focus:ring-amber-500"
            }`}
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Anonymous Display (Display Only) */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="anonymousDisplay"
              checked={data.anonymousDisplay}
              onChange={handleChange}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">
              {t("donation.step2.anonymousLabel")}
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            {t("donation.step2.anonymousNote")}
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <PrimaryButton
            type="button"
            onClick={prevStep}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            {t("donation.step2.back")}
          </PrimaryButton>
          <PrimaryButton type="submit" className="flex-1" disabled={isLoading}>
            {isLoading
              ? t("donation.step2.sendingOtp")
              : t("donation.step2.sendOtpContinue")}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default Step2DonorDetails;
