import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { reapplyForCollector, getCollectorStatus } from "../services/collectorApi";
import SectionHeading from "../components/SectionHeading";

// Constants
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];

/**
 * CollectorReapplyPage - Form for rejected users to reapply as collectors
 */
const CollectorReapplyPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, checkAuth } = useAuth();
  
  // Previous rejection info
  const [previousRejection, setPreviousRejection] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    address: "",
    panNumber: "",
  });
  
  // File state
  const [aadharFront, setAadharFront] = useState(null);
  const [aadharBack, setAadharBack] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);
  const [backPreview, setBackPreview] = useState(null);
  
  // UI state
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  
  // Refs for file inputs
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Check eligibility on mount
  useEffect(() => {
    const checkEligibility = async () => {
      if (!isAuthenticated || authLoading) return;
      
      setCheckingEligibility(true);
      try {
        const response = await getCollectorStatus();
        const { role, collectorProfile } = response.data || {};
        
        // Only rejected users can reapply
        if (collectorProfile?.status !== "rejected") {
          if (role === "COLLECTOR_PENDING") {
            navigate("/", { replace: true });
          } else if (role === "COLLECTOR_APPROVED") {
            navigate("/collector", { replace: true });
          } else if (role === "USER" && collectorProfile?.status !== "rejected") {
            navigate("/collector/apply", { replace: true });
          }
          return;
        }
        
        // Store previous rejection info
        setPreviousRejection({
          reason: collectorProfile.rejectedReason,
          submittedAt: collectorProfile.submittedAt,
        });
        
        // Prefill form with previous data
        if (collectorProfile.fullName) {
          setFormData((prev) => ({
            ...prev,
            fullName: collectorProfile.fullName,
            address: collectorProfile.address || "",
            panNumber: collectorProfile.panNumber || "",
          }));
        }
      } catch (err) {
        console.error("Error checking eligibility:", err);
      } finally {
        setCheckingEligibility(false);
      }
    };
    
    checkEligibility();
  }, [isAuthenticated, authLoading, navigate]);

  /**
   * Validate a single file
   */
  const validateFile = (file, fieldName) => {
    if (!file) {
      return `${fieldName} is required`;
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Only JPG, JPEG, PNG files are allowed`;
    }
    
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid file extension. Only .jpg, .jpeg, .png allowed`;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File size must be less than 2MB`;
    }
    
    return null;
  };

  /**
   * Handle file selection
   */
  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file, type === "front" ? "Aadhaar Front" : "Aadhaar Back");
    
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [type === "front" ? "aadharFront" : "aadharBack"]: error,
      }));
      return;
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[type === "front" ? "aadharFront" : "aadharBack"];
      return newErrors;
    });

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "front") {
        setAadharFront(file);
        setFrontPreview(reader.result);
      } else {
        setAadharBack(file);
        setBackPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  /**
   * Remove selected file
   */
  const removeFile = (type) => {
    if (type === "front") {
      setAadharFront(null);
      setFrontPreview(null);
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      setAadharBack(null);
      setBackPreview(null);
      if (backInputRef.current) backInputRef.current.value = "";
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  /**
   * Validate form
   */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "Address must be at least 10 characters";
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const panUpper = formData.panNumber.toUpperCase().trim();
    if (!panUpper) {
      newErrors.panNumber = "PAN number is required";
    } else if (!panRegex.test(panUpper)) {
      newErrors.panNumber = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    const frontError = validateFile(aadharFront, "Aadhaar Front");
    if (frontError) newErrors.aadharFront = frontError;

    const backError = validateFile(aadharBack, "Aadhaar Back");
    if (backError) newErrors.aadharBack = backError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const data = new FormData();
      data.append("fullName", formData.fullName.trim());
      data.append("address", formData.address.trim());
      data.append("panNumber", formData.panNumber.toUpperCase().trim());
      data.append("aadharFront", aadharFront);
      data.append("aadharBack", aadharBack);

      await reapplyForCollector(data);
      
      setSubmitSuccess(true);
      await checkAuth();
      
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err) {
      console.error("Reapplication error:", err);
      setSubmitError(err.message || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading || checkingEligibility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    navigate("/login", { state: { from: "/collector/reapply" } });
    return null;
  }

  // Success state
  if (submitSuccess) {
    return (
      <div className="py-16 px-4 bg-amber-50 min-h-screen">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Application Resubmitted!</h2>
            <p className="text-gray-600 mb-6">
              Your collector application has been resubmitted successfully. 
              We will review your updated documents and notify you soon.
            </p>
            <p className="text-sm text-gray-500">Redirecting to home...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 bg-amber-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <SectionHeading
          title="Reapply for Collector"
          subtitle="Submit updated information to reapply as a collector"
          center
        />

        {/* Previous Rejection Info */}
        {previousRejection && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-red-800 font-medium text-sm">Previous Application Rejected</p>
                <p className="text-red-700 text-sm mt-1">{previousRejection.reason}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-800 text-sm">{submitError}</p>
                </div>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your full name as per Aadhaar"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors resize-none ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your complete address"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* PAN Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleInputChange}
                maxLength={10}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors uppercase ${
                  errors.panNumber ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="ABCDE1234F"
              />
              {errors.panNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.panNumber}</p>
              )}
            </div>

            {/* Aadhaar Front */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Card (Front) <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-1">(Upload new)</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                errors.aadharFront ? "border-red-300 bg-red-50" : frontPreview ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-amber-400"
              }`}>
                {frontPreview ? (
                  <div className="relative">
                    <img
                      src={frontPreview}
                      alt="Aadhaar Front Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("front")}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm text-green-600 mt-2">{aadharFront?.name}</p>
                  </div>
                ) : (
                  <div
                    onClick={() => frontInputRef.current?.click()}
                    className="cursor-pointer py-8"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 text-sm">Click to upload Aadhaar front</p>
                    <p className="text-gray-400 text-xs mt-1">JPG, JPEG, PNG (max 2MB)</p>
                  </div>
                )}
                <input
                  ref={frontInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="hidden"
                />
              </div>
              {errors.aadharFront && (
                <p className="mt-1 text-sm text-red-600">{errors.aadharFront}</p>
              )}
            </div>

            {/* Aadhaar Back */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Card (Back) <span className="text-red-500">*</span>
                <span className="text-gray-500 font-normal ml-1">(Upload new)</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                errors.aadharBack ? "border-red-300 bg-red-50" : backPreview ? "border-green-300 bg-green-50" : "border-gray-300 hover:border-amber-400"
              }`}>
                {backPreview ? (
                  <div className="relative">
                    <img
                      src={backPreview}
                      alt="Aadhaar Back Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile("back")}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <p className="text-sm text-green-600 mt-2">{aadharBack?.name}</p>
                  </div>
                ) : (
                  <div
                    onClick={() => backInputRef.current?.click()}
                    className="cursor-pointer py-8"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-600 text-sm">Click to upload Aadhaar back</p>
                    <p className="text-gray-400 text-xs mt-1">JPG, JPEG, PNG (max 2MB)</p>
                  </div>
                )}
                <input
                  ref={backInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "back")}
                  className="hidden"
                />
              </div>
              {errors.aadharBack && (
                <p className="mt-1 text-sm text-red-600">{errors.aadharBack}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                "Resubmit Application"
              )}
            </button>

            <p className="text-center text-xs text-gray-500">
              Please ensure all documents are clear and readable. 
              Incomplete or unclear submissions may be rejected.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CollectorReapplyPage;
