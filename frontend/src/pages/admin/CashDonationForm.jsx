import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { donationHeads } from "../../data/dummyData";
import { formatCurrency } from "../../utils/helpers";
import { ArrowLeft, CheckCircle, Download } from "lucide-react";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CHEQUE", label: "Cheque" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh",
];

const CashDonationForm = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    // Structured address fields
    addressLine: "",
    addressCity: "",
    addressState: "",
    addressCountry: "India",
    addressPincode: "",
    dob: "",
    idType: "PAN",
    idNumber: "",
    anonymousDisplay: false,
    donationHeadId: "",
    amount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    // Payment method
    paymentMethod: "CASH",
    // Payment detail fields (conditionally required)
    utrNumber: "",
    chequeNumber: "",
    bankName: "",
    chequeDate: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);

  // Validate PAN format
  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  // Validate age (must be 18+)
  const validateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 18;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "idNumber") {
      // Auto uppercase for PAN
      const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: formattedValue }));
    } else if (name === "mobile") {
      // Only digits, max 10
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else if (name === "amount") {
      // Only positive numbers
      const numValue = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else if (name === "addressPincode") {
      // Only digits, max 6
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else if (name === "utrNumber") {
      // UTR: alphanumeric, max 22
      const cleaned = value.replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
    } else if (name === "paymentMethod") {
      // Reset payment-specific fields when method changes
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        utrNumber: "",
        chequeNumber: "",
        bankName: "",
        chequeDate: "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = "Donor name is required";
    // Structured address: at least addressLine OR city is required
    if (!formData.addressLine.trim() && !formData.addressCity.trim()) {
      newErrors.addressLine = "Address line or city is required";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else if (!validateAge(formData.dob)) {
      newErrors.dob = "Donor must be 18 years or older";
    }

    // PAN validation
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "PAN number is required";
    } else if (!validatePAN(formData.idNumber)) {
      newErrors.idNumber = "Invalid PAN format (e.g., ABCDE1234F)";
    }

    // Donation details
    if (!formData.donationHeadId) newErrors.donationHeadId = "Please select a donation cause";
    if (!formData.amount || parseInt(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount";
    }

    // Pincode validation (optional but must be valid if entered)
    if (formData.addressPincode && !/^\d{6}$/.test(formData.addressPincode)) {
      newErrors.addressPincode = "Pincode must be 6 digits";
    }

    // Payment method-specific validation
    if (formData.paymentMethod === "UPI") {
      if (!formData.utrNumber.trim()) {
        newErrors.utrNumber = "UTR number is required for UPI payments";
      }
    }
    if (formData.paymentMethod === "CHEQUE") {
      if (!formData.chequeNumber.trim()) {
        newErrors.chequeNumber = "Cheque number is required";
      }
      if (!formData.bankName.trim()) {
        newErrors.bankName = "Bank name is required for cheque payments";
      }
    }

    // Optional email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const selectedHead = donationHeads.find(
        (h) => String(h.id) === String(formData.donationHeadId)
      );

      const payload = {
        donor: {
          name: formData.name.trim(),
          mobile: formData.mobile ? `+91${formData.mobile}` : "N/A",
          email: formData.email || undefined,
          addressObj: {
            line: formData.addressLine.trim(),
            city: formData.addressCity.trim(),
            state: formData.addressState.trim(),
            country: formData.addressCountry.trim() || "India",
            pincode: formData.addressPincode.trim(),
          },
          dob: formData.dob,
          idType: formData.idType,
          idNumber: formData.idNumber,
          anonymousDisplay: formData.anonymousDisplay,
        },
        donationHead: {
          id: String(selectedHead.id),
          name: selectedHead.name,
        },
        amount: parseInt(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
      };

      // Add payment-specific details
      if (formData.paymentMethod === "UPI") {
        payload.paymentDetails = { utrNumber: formData.utrNumber.trim() };
      }
      if (formData.paymentMethod === "CHEQUE") {
        payload.paymentDetails = {
          chequeNumber: formData.chequeNumber.trim(),
          bankName: formData.bankName.trim(),
          chequeDate: formData.chequeDate || undefined,
        };
      }

      const response = await fetch(`${API_BASE_URL}/admin/system/donations/cash`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to create donation");
      }

      setSuccess({
        donationId: data.donationId,
        receiptNumber: data.receiptNumber,
        receiptUrl: data.receiptUrl,
        transactionRef: data.transactionRef,
        paymentMethod: data.paymentMethod || formData.paymentMethod,
        amount: parseInt(formData.amount),
        donorName: formData.name,
        donationHead: selectedHead.name,
      });
    } catch (err) {
      setSubmitError(err.message || "Failed to create donation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = () => {
    if (success?.receiptUrl) {
      // Use relative path for receipts served from same origin
      window.open(success.receiptUrl, "_blank");
    }
  };

  const handleAddAnother = () => {
    setFormData({
      name: "",
      mobile: "",
      email: "",
      addressLine: "",
      addressCity: "",
      addressState: "",
      addressCountry: "India",
      addressPincode: "",
      dob: "",
      idType: "PAN",
      idNumber: "",
      anonymousDisplay: false,
      donationHeadId: "",
      amount: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "CASH",
      utrNumber: "",
      chequeNumber: "",
      bankName: "",
      chequeDate: "",
    });
    setSuccess(null);
    setErrors({});
    setSubmitError("");
  };

  // Success view
  if (success) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Donation Recorded!
          </h2>
          <p className="text-gray-600 mb-6">
            The {success.paymentMethod?.toLowerCase() || "cash"} donation has been successfully recorded in the system.
          </p>

          <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Donor Name:</span>
              <span className="font-medium">{success.donorName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Donation Head:</span>
              <span className="font-medium">{success.donationHead}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(success.amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Receipt Number:</span>
              <span className="font-mono text-sm">{success.receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction Ref:</span>
              <span className="font-mono text-xs">{success.transactionRef}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            {success.receiptUrl && (
              <button
                onClick={handleDownloadReceipt}
                className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Receipt
              </button>
            )}
            <button
              onClick={handleAddAnother}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-md hover:bg-gray-200 transition-colors"
            >
              Add Another Donation
            </button>
            <button
              onClick={() => navigate("/admin/system/donations")}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
            >
              View All Donations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/admin/system/donations")}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Donations
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Add Donation</h1>
        <p className="text-gray-600 text-sm mt-1">
          Record a cash, UPI, or cheque donation received at the ashram
        </p>
      </div>

      {/* Error Message */}
      {submitError && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Donor Details Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Donor Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Donor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter donor's full name"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.name
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Mobile Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number (Optional)
              </label>
              <div className="flex">
                <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-l-md">
                  +91
                </span>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Email (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="donor@email.com"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.email
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Receipt will be emailed if provided
              </p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18))
                  .toISOString()
                  .split("T")[0]}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.dob
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.dob && (
                <p className="mt-1 text-xs text-red-600">{errors.dob}</p>
              )}
            </div>

            {/* Address Line */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="addressLine"
                value={formData.addressLine}
                onChange={handleChange}
                placeholder="House/Flat No., Street, Area, Landmark"
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

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                name="addressCity"
                value={formData.addressCity}
                onChange={handleChange}
                placeholder="e.g. Mumbai"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select
                name="addressState"
                value={formData.addressState}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pincode
              </label>
              <input
                type="text"
                name="addressPincode"
                value={formData.addressPincode}
                onChange={handleChange}
                placeholder="6-digit pincode"
                maxLength={6}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.addressPincode
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.addressPincode && (
                <p className="mt-1 text-xs text-red-600">{errors.addressPincode}</p>
              )}
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                name="addressCountry"
                value={formData.addressCountry}
                onChange={handleChange}
                placeholder="India"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* PAN Number */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PAN Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="idNumber"
                value={formData.idNumber}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                maxLength={10}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono uppercase ${
                  errors.idNumber
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              />
              {errors.idNumber && (
                <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                PAN is mandatory for statutory donation records
              </p>
            </div>

            {/* Anonymous Display */}
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="anonymousDisplay"
                  checked={formData.anonymousDisplay}
                  onChange={handleChange}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <span className="text-sm text-gray-700">
                  Display as "Anonymous" on public donor lists
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Donation Details Section */}
        <div className="border-b border-gray-200 pb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Donation Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Donation Head */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Donation Cause <span className="text-red-500">*</span>
              </label>
              <select
                name="donationHeadId"
                value={formData.donationHeadId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  errors.donationHeadId
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-amber-500"
                }`}
              >
                <option value="">Select a cause</option>
                {donationHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name}
                  </option>
                ))}
              </select>
              {errors.donationHeadId && (
                <p className="mt-1 text-xs text-red-600">{errors.donationHeadId}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  ₹
                </span>
                <input
                  type="text"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="Enter amount"
                  className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                    errors.amount
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-amber-500"
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
              )}
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Date when payment was received (defaults to today)
              </p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            {/* UPI-specific: UTR Number */}
            {formData.paymentMethod === "UPI" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UTR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="utrNumber"
                  value={formData.utrNumber}
                  onChange={handleChange}
                  placeholder="Enter UPI Transaction Reference Number"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono ${
                    errors.utrNumber
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-amber-500"
                  }`}
                />
                {errors.utrNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.utrNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  UTR/Reference number from the UPI payment confirmation
                </p>
              </div>
            )}

            {/* Cheque-specific fields */}
            {formData.paymentMethod === "CHEQUE" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cheque Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={formData.chequeNumber}
                    onChange={handleChange}
                    placeholder="Enter cheque number"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 font-mono ${
                      errors.chequeNumber
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-amber-500"
                    }`}
                  />
                  {errors.chequeNumber && (
                    <p className="mt-1 text-xs text-red-600">{errors.chequeNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. State Bank of India"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                      errors.bankName
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-amber-500"
                    }`}
                  />
                  {errors.bankName && (
                    <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cheque Date
                  </label>
                  <input
                    type="date"
                    name="chequeDate"
                    value={formData.chequeDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/system/donations")}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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
                Recording Donation...
              </>
            ) : (
              `Record ${formData.paymentMethod === "CASH" ? "Cash" : formData.paymentMethod === "UPI" ? "UPI" : "Cheque"} Donation`
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CashDonationForm;
