import { useState } from "react";
import FormInput from "../../../components/FormInput";
import PrimaryButton from "../../../components/PrimaryButton";
import { validateEmail, validatePhone } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";

const Step2DonorDetails = ({ data, updateData, nextStep, prevStep }) => {
  const [errors, setErrors] = useState({});
  const [showEmailInput, setShowEmailInput] = useState(data.emailOptIn);
  const [editingGovtId, setEditingGovtId] = useState(false);

  // OTP state
  const [otpStep, setOtpStep] = useState("form"); // 'form' | 'otp'
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Email verification state
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [emailVerificationError, setEmailVerificationError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0); // Cooldown timer in seconds

  /**
   * Get JWT token from localStorage for authenticated requests
   */
  const getAuthToken = () => localStorage.getItem("token");

  /**
   * Request email verification - sends verification link to email
   */
  const handleRequestEmailVerification = async () => {
    if (!data.email || !validateEmail(data.email)) {
      setEmailVerificationError("Please enter a valid email address first");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setEmailVerificationError("Please login to verify your email");
      return;
    }

    setEmailVerifying(true);
    setEmailVerificationError("");
    setEmailVerificationSent(false);

    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/request-email-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ email: data.email }),
        },
      );

      const result = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(result.message || "Failed to send verification email");
      }

      if (result.alreadyVerified) {
        // Email already verified
        updateData({ emailVerified: true });
      } else {
        setEmailVerificationSent(true);
        // Start 60 second cooldown for resend
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      setEmailVerificationError(
        err.message || "Failed to send verification email",
      );
    } finally {
      setEmailVerifying(false);
    }
  };

  /**
   * Check email verification status (poll from backend)
   */
  const checkEmailStatus = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/email-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await parseJsonResponse(response);
        if (result.email === data.email && result.emailVerified) {
          updateData({ emailVerified: true });
          setEmailVerificationSent(false);
        }
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      if (name === "emailOptIn") {
        setShowEmailInput(checked);
        updateData({
          emailOptIn: checked,
          email: checked ? data.email : "",
          emailVerified: false,
        });
        // Reset email verification state
        setEmailVerificationSent(false);
        setEmailVerificationError("");
      } else if (name === "anonymousDisplay") {
        updateData({ anonymousDisplay: checked });
      }
    } else {
      updateData({ [name]: value });
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: "" }));
      }

      // Reset email verified status when email changes
      if (name === "email") {
        updateData({ emailVerified: false });
        setEmailVerificationSent(false);
        setEmailVerificationError("");
      }
    }
  };

  const handleGovtIdTypeChange = (type) => {
    updateData({ govtIdType: type });
    setEditingGovtId(true);
    if (errors.govtId) {
      setErrors((prev) => ({ ...prev, govtId: "" }));
    }
  };

  const validatePAN = (pan) => {
    const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panPattern.test(pan);
  };

  const handleGovtIdChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "aadhaar") {
      formattedValue = value.replace(/\D/g, "").slice(0, 12);
    } else if (name === "pan") {
      formattedValue = value
        .replace(/[^A-Z0-9]/gi, "")
        .slice(0, 10)
        .toUpperCase();
    }

    updateData({ [name]: formattedValue });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleDOBChange = (e) => {
    updateData({ dateOfBirth: e.target.value });
    if (errors.dateOfBirth) {
      setErrors((prev) => ({ ...prev, dateOfBirth: "" }));
    }
  };

  const maskGovtId = (value, type) => {
    if (!value) return "";
    if (editingGovtId) return value;
    if (type === "aadhaar" && value.length > 4) {
      return "**** **** " + value.slice(-4);
    } else if (type === "pan" && value.length > 4) {
      return "****" + value.slice(-4);
    }
    return value;
  };

  /**
   * Validate form and send OTP
   */
  const handleSendOtp = async (e) => {
    e.preventDefault();

    const newErrors = {};

    // Full Name
    if (!data.name.trim()) {
      newErrors.name = "Full name is required";
    }

    // Mobile Number
    if (!data.mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
    } else if (!validatePhone(data.mobile)) {
      newErrors.mobile = "Please enter a valid 10-digit mobile number";
    }

    // Email (optional)
    if (showEmailInput && data.email) {
      if (!validateEmail(data.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    // Address
    if (!data.address.trim()) {
      newErrors.address = "Address is required";
    }

    // Government ID
    if (!data.govtIdType) {
      newErrors.govtId = "Please select a government ID type";
    } else {
      if (data.govtIdType === "aadhaar") {
        if (!data.aadhaar || data.aadhaar.length !== 12) {
          newErrors.aadhaar = "Please enter a valid 12-digit Aadhaar number";
        }
      } else if (data.govtIdType === "pan") {
        if (!data.pan || data.pan.length !== 10) {
          newErrors.pan = "Please enter a valid 10-character PAN number";
        } else if (!validatePAN(data.pan)) {
          newErrors.pan = "PAN must be in format: AAAAA9999A";
        }
      }
    }

    // DOB
    if (!data.dateOfBirth) {
      newErrors.dateOfBirth = "Date of Birth is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Send OTP
    setIsLoading(true);
    setOtpError("");

    try {
      const response = await fetch(`${API_BASE_URL}/donations/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: data.mobile }),
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
      setOtpError("Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    setOtpError("");

    try {
      const response = await fetch(`${API_BASE_URL}/donations/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: data.mobile, otp }),
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

    try {
      const response = await fetch(`${API_BASE_URL}/donations/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: data.mobile }),
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
          Verify Mobile Number
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Enter the OTP sent to {data.mobile}
        </p>

        {otpError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {otpError}
          </div>
        )}

        {otpSent && !otpError && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
            OTP sent successfully! Check your phone.
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
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
              placeholder="Enter 6-digit OTP"
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
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </PrimaryButton>

          <div className="flex justify-between items-center text-sm">
            <button
              type="button"
              onClick={handleBackToForm}
              className="text-amber-600 hover:text-amber-700"
            >
              ← Change Details
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              Resend OTP
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
        Donor Details
      </h2>

      {otpError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {otpError}
        </div>
      )}

      <form onSubmit={handleSendOtp} className="space-y-4">
        {/* Full Name (required) */}
        <FormInput
          label="Full Name"
          name="name"
          value={data.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          required
          error={errors.name}
        />

        {/* Mobile Number (required, 10 digits) */}
        <FormInput
          label="Mobile Number"
          type="tel"
          name="mobile"
          value={data.mobile}
          onChange={(e) => {
            const mobile = e.target.value.replace(/\D/g, "").slice(0, 10);
            updateData({ mobile });
            if (errors.mobile) {
              setErrors((prev) => ({ ...prev, mobile: "" }));
            }
          }}
          placeholder="Enter your 10-digit mobile number"
          required
          error={errors.mobile}
        />

        {/* Email (Optional - Opt-in only) */}
        <div>
          <label className="flex items-center space-x-2 mb-2">
            <input
              type="checkbox"
              name="emailOptIn"
              checked={data.emailOptIn}
              onChange={handleChange}
              className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Add email ID to receive receipt & updates
            </span>
          </label>

          {showEmailInput && (
            <div>
              <FormInput
                label="Email Address"
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                placeholder="Enter your email"
                error={errors.email}
              />
              {data.email && validateEmail(data.email) && (
                <div className="mt-2 space-y-2">
                  {data.emailVerified ? (
                    // Verified state
                    <div className="flex items-center text-sm text-green-600">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Email verified
                    </div>
                  ) : emailVerificationSent ? (
                    // Verification sent - waiting for user to click link
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-start space-x-2">
                        <svg
                          className="w-5 h-5 text-blue-600 mt-0.5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-blue-800 font-medium">
                            Verification email sent!
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Check your inbox and click the link to verify. Link
                            expires in 15 minutes.
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              type="button"
                              onClick={checkEmailStatus}
                              className="text-xs text-blue-700 underline hover:text-blue-800"
                            >
                              I've verified, check now
                            </button>
                            <span className="text-xs text-gray-400">|</span>
                            <button
                              type="button"
                              onClick={handleRequestEmailVerification}
                              disabled={emailVerifying || resendCooldown > 0}
                              className="text-xs text-blue-700 underline hover:text-blue-800 disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                            >
                              {emailVerifying
                                ? "Sending..."
                                : resendCooldown > 0
                                  ? `Resend in ${resendCooldown}s`
                                  : "Resend email"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Not verified - show verify button
                    <div>
                      <button
                        type="button"
                        onClick={handleRequestEmailVerification}
                        disabled={emailVerifying}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 border border-amber-300 rounded-md hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {emailVerifying ? (
                          <>
                            <svg
                              className="animate-spin w-4 h-4 mr-2"
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
                            Sending...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                            Verify Email
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 mt-1">
                        Click to receive a verification link
                      </p>
                      {emailVerificationError && (
                        <p className="text-xs text-red-600 mt-1">
                          {emailVerificationError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
              {data.email && !validateEmail(data.email) && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter a valid email to verify
                </p>
              )}
            </div>
          )}
        </div>

        {/* Address (required) */}
        <FormInput
          label="Address"
          name="address"
          value={data.address}
          onChange={handleChange}
          placeholder="Enter your complete address"
          required
          error={errors.address}
        />

        {/* Government ID (Mandatory - Any One) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Government ID <span className="text-red-500">*</span>
          </label>

          {/* Radio selection for ID type */}
          <div className="flex space-x-4 mb-3">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="govtIdType"
                value="aadhaar"
                checked={data.govtIdType === "aadhaar"}
                onChange={(e) => handleGovtIdTypeChange("aadhaar")}
                className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">Aadhaar</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="govtIdType"
                value="pan"
                checked={data.govtIdType === "pan"}
                onChange={(e) => handleGovtIdTypeChange("pan")}
                className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500"
              />
              <span className="text-sm text-gray-700">PAN</span>
            </label>
          </div>

          {/* Show selected ID input */}
          {data.govtIdType === "aadhaar" && (
            <div>
              <FormInput
                label="Aadhaar Number"
                type="text"
                name="aadhaar"
                value={maskGovtId(data.aadhaar, "aadhaar")}
                onChange={handleGovtIdChange}
                onFocus={() => setEditingGovtId(true)}
                onBlur={() => {
                  setTimeout(() => setEditingGovtId(false), 200);
                }}
                placeholder="Enter 12-digit Aadhaar number"
                required
                error={errors.aadhaar}
                maxLength={16}
              />
              {data.aadhaar && !editingGovtId && (
                <button
                  type="button"
                  onClick={() => setEditingGovtId(true)}
                  className="text-xs text-amber-600 hover:text-amber-700 mt-1"
                >
                  Edit
                </button>
              )}
            </div>
          )}

          {data.govtIdType === "pan" && (
            <div className="space-y-3">
              <div>
                <FormInput
                  label="PAN Number"
                  type="text"
                  name="pan"
                  value={maskGovtId(data.pan, "pan")}
                  onChange={handleGovtIdChange}
                  onFocus={() => setEditingGovtId(true)}
                  onBlur={() => {
                    setTimeout(() => setEditingGovtId(false), 200);
                  }}
                  placeholder="Enter 10-character PAN number (e.g., ABCDE1234F)"
                  required
                  error={errors.pan}
                  maxLength={14}
                />
                {data.pan && !editingGovtId && (
                  <button
                    type="button"
                    onClick={() => setEditingGovtId(true)}
                    className="text-xs text-amber-600 hover:text-amber-700 mt-1"
                  >
                    Edit
                  </button>
                )}
              </div>

              {/* Helper Text for PAN */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-xs text-blue-700">
                  Required for statutory donation records. Your information is
                  kept confidential.
                </p>
              </div>
            </div>
          )}

          {errors.govtId && (
            <p className="mt-1 text-sm text-red-600">{errors.govtId}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
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
              Display my name as Anonymous publicly
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            This only affects public donation lists. All details are still
            collected internally.
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
            Back
          </PrimaryButton>
          <PrimaryButton type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Sending OTP..." : "Send OTP & Continue"}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
};

export default Step2DonorDetails;
