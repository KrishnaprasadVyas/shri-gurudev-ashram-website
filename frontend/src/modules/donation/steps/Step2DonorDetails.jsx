/**
 * Step 2: Donor Details Form
 *
 * Phone verification has been migrated to Firebase Phone Auth.
 * This step now collects donor information and proceeds directly to review.
 * Phone number is still collected for donation records and receipts.
 */

import { useState, useEffect, useRef } from "react";
import FormInput from "../../../components/FormInput";
import PrimaryButton from "../../../components/PrimaryButton";
import {
  API_BASE_URL,
  getAuthToken,
  parseJsonResponse,
} from "../../../utils/api";
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

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Chandigarh",
  "Puducherry",
  "Jammu and Kashmir",
  "Ladakh",
];

/**
 * Parse a legacy address string into structured address fields.
 */
const parseLegacyAddress = (addressStr) => {
  if (!addressStr || typeof addressStr !== "string") return null;

  const parts = addressStr
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;

  const result = {
    line: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
  };

  const pincodeMatch = addressStr.match(/\b(\d{6})\b/);
  if (pincodeMatch) {
    result.pincode = pincodeMatch[1];
  }

  for (const state of INDIAN_STATES) {
    if (addressStr.toLowerCase().includes(state.toLowerCase())) {
      result.state = state;
      break;
    }
  }

  if (parts.length >= 2) {
    result.line = parts[0];
    result.city = parts[1];
  } else {
    result.line = parts[0];
  }

  return result;
};

const Step2DonorDetails = ({ data, updateData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [country, setCountry] = useState(COUNTRY_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const { t } = useTranslation();

  const prefillAttempted = useRef(false);
  const legacyMigrated = useRef(false);

  /**
   * Backward compatibility: parse legacy address string
   */
  useEffect(() => {
    if (legacyMigrated.current) return;
    legacyMigrated.current = true;

    if (
      data.address &&
      typeof data.address === "string" &&
      !data.addressLine &&
      !data.addressCity
    ) {
      const parsed = parseLegacyAddress(data.address);
      if (parsed) {
        updateData({
          addressLine: parsed.line,
          addressCity: parsed.city,
          addressState: parsed.state,
          addressCountry: parsed.country,
          addressPincode: parsed.pincode,
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Auto-fill donor details from last successful donation (authenticated users only).
   */
  useEffect(() => {
    if (prefillAttempted.current) return;
    prefillAttempted.current = true;

    const token = getAuthToken();
    if (!token) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/donations/me/last-profile`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });

        if (!res.ok) return;

        const profile = await parseJsonResponse(res);
        if (!profile) return;

        const updates = {};

        if (!data.name && profile.fullName) {
          updates.name = profile.fullName;
        }

        if (!data.mobile && profile.mobile) {
          let mobile = profile.mobile.replace(/[^\d]/g, "");
          if (mobile.startsWith("91") && mobile.length === 12) {
            mobile = mobile.slice(2);
          }
          updates.mobile = mobile;
        }

        if (!data.email && profile.email) {
          updates.email = profile.email;
        }

        if (!data.pan && profile.panNumber) {
          updates.pan = profile.panNumber;
        }

        if (!data.dateOfBirth && profile.dob) {
          const d = new Date(profile.dob);
          if (!isNaN(d.getTime())) {
            updates.dateOfBirth = d.toISOString().split("T")[0];
          }
        }

        if (
          profile.addressObj &&
          (profile.addressObj.line || profile.addressObj.city)
        ) {
          if (!data.addressLine)
            updates.addressLine = profile.addressObj.line || "";
          if (!data.addressCity)
            updates.addressCity = profile.addressObj.city || "";
          if (!data.addressState)
            updates.addressState = profile.addressObj.state || "";
          if (!data.addressCountry || data.addressCountry === "India") {
            updates.addressCountry = profile.addressObj.country || "India";
          }
          if (!data.addressPincode)
            updates.addressPincode = profile.addressObj.pincode || "";
        } else if (profile.address && !data.addressLine && !data.addressCity) {
          const parsed = parseLegacyAddress(profile.address);
          if (parsed) {
            if (!data.addressLine) updates.addressLine = parsed.line;
            if (!data.addressCity) updates.addressCity = parsed.city;
            if (!data.addressState) updates.addressState = parsed.state;
            if (!data.addressPincode) updates.addressPincode = parsed.pincode;
          }
        }

        if (Object.keys(updates).length > 0) {
          updateData(updates);
        }
      } catch {
        // Fail silently
      }
    })();

    return () => controller.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "anonymousDisplay") {
        updateData({ anonymousDisplay: checked });
      }
    } else if (name === "addressPincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      updateData({ [name]: digits });
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
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
   * Validate form and proceed to next step
   * Phone verification is no longer required here - handled by Firebase Auth at login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!data.name.trim()) {
      newErrors.name = t("donation.step2.nameRequired");
    }

    if (!data.mobile.trim()) {
      newErrors.mobile = t("donation.step2.mobileRequired");
    } else if (data.mobile.length !== country.length) {
      newErrors.mobile = t("donation.step2.mobileDigitInvalid", {
        length: country.length,
      });
    }

    if (!data.addressLine || !data.addressLine.trim()) {
      newErrors.addressLine = t(
        "donation.step2.addressLineRequired",
        "Address line is required",
      );
    }
    if (!data.addressCity || !data.addressCity.trim()) {
      newErrors.addressCity = t(
        "donation.step2.cityRequired",
        "City is required",
      );
    }
    if (!data.addressState || !data.addressState.trim()) {
      newErrors.addressState = t(
        "donation.step2.stateRequired",
        "State is required",
      );
    }
    if (!data.addressPincode || !data.addressPincode.trim()) {
      newErrors.addressPincode = t(
        "donation.step2.pincodeRequired",
        "Pincode is required",
      );
    } else if (!/^\d{6}$/.test(data.addressPincode)) {
      newErrors.addressPincode = t(
        "donation.step2.pincodeInvalid",
        "Pincode must be 6 digits",
      );
    }

    if (!data.pan || data.pan.length !== 10) {
      newErrors.pan = t("donation.step2.panLengthInvalid");
    } else if (!validatePAN(data.pan)) {
      newErrors.pan = t("donation.step2.panInvalid");
    }

    if (!data.dateOfBirth) {
      newErrors.dateOfBirth = t("donation.step2.dobRequired");
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Proceed to next step (no OTP verification needed)
    nextStep();
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        {t("donation.step2.donorDetails")}
      </h2>

      {formError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {/* Structured Address Section */}
        <div className="border-t border-gray-200 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">
            {t("donation.step2.addressSectionTitle", "Address Details")}
          </h3>

          {/* Address Line */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("donation.step2.addressLine", "Address Line")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="addressLine"
              value={data.addressLine || ""}
              onChange={handleChange}
              placeholder={t(
                "donation.step2.addressLinePlaceholder",
                "House/Flat No., Street, Area, Landmark",
              )}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                errors.addressLine
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-amber-500"
              }`}
            />
            {errors.addressLine && (
              <p className="mt-1 text-xs text-red-600">{errors.addressLine}</p>
            )}
          </div>

          {/* City & State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("donation.step2.city", "City")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressCity"
                value={data.addressCity || ""}
                onChange={handleChange}
                placeholder={t("donation.step2.cityPlaceholder", "e.g. Mumbai")}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.addressCity
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.addressCity && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.addressCity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("donation.step2.state", "State")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                name="addressState"
                value={data.addressState || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white ${
                  errors.addressState
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              >
                <option value="">
                  {t("donation.step2.selectState", "Select state")}
                </option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {errors.addressState && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.addressState}
                </p>
              )}
            </div>
          </div>

          {/* Pincode & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("donation.step2.pincode", "Pincode")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressPincode"
                value={data.addressPincode || ""}
                onChange={handleChange}
                placeholder={t(
                  "donation.step2.pincodePlaceholder",
                  "6-digit pincode",
                )}
                maxLength={6}
                inputMode="numeric"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.addressPincode
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.addressPincode && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.addressPincode}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("donation.step2.addressCountry", "Country")}
              </label>
              <input
                type="text"
                name="addressCountry"
                value={data.addressCountry || "India"}
                onChange={handleChange}
                placeholder="India"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* PAN Number */}
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

        {/* Anonymous Display */}
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
            {t("donation.step2.continue", "Continue")}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default Step2DonorDetails;
