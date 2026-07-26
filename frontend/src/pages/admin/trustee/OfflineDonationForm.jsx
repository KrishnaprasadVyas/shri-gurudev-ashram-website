import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Download, Heart, AlertCircle } from "lucide-react";
import { financeApi } from "../../../services/financeApi";

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash (Counter Deposit)" },
  { value: "UPI", label: "UPI Transfer" },
  { value: "CHEQUE", label: "Bank Cheque" },
  { value: "RTGS", label: "RTGS Transfer" },
  { value: "NEFT", label: "NEFT Transfer" },
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

const OfflineDonationForm = () => {
  const [donationHeads, setDonationHeads] = useState([]);
  const [loadingHeads, setLoadingHeads] = useState(true);
  const [headsError, setHeadsError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    addressLine: "",
    addressCity: "",
    addressState: "Maharashtra",
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
    referenceNumber: "",
    chequeNumber: "",
    bankName: "",
    chequeDate: "",
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(null);

  // Fetch active donation heads from API (Phase 4 requirement: replace dummyData.js)
  useEffect(() => {
    const loadCauses = async () => {
      setLoadingHeads(true);
      try {
        const res = await financeApi.getPublicDonationHeads();
        if (res && res.data) {
          setDonationHeads(res.data);
        } else if (Array.isArray(res)) {
          setDonationHeads(res);
        } else {
          setDonationHeads([]);
        }
      } catch (err) {
        console.error("Error loading donation causes:", err);
        setHeadsError("Failed to load donation causes from server.");
      } finally {
        setLoadingHeads(false);
      }
    };
    loadCauses();
  }, []);

  const getHeadName = (head) => {
    if (!head) return "";
    if (typeof head.name === "object") {
      return head.name.en || head.name.hi || Object.values(head.name)[0] || "Seva";
    }
    return head.name || head.title || "Seva";
  };

  const validatePAN = (pan) => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan.toUpperCase());
  };

  const validateAge = (dob) => {
    if (!dob) return false;
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
      const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: formatted }));
    } else if (name === "mobile") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else if (name === "amount") {
      const num = value.replace(/[^0-9]/g, "");
      setFormData((prev) => ({ ...prev, [name]: num }));
    } else if (name === "addressPincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, [name]: digits }));
    } else if (name === "utrNumber" || name === "referenceNumber") {
      const cleaned = value.replace(/[^A-Za-z0-9]/g, "").slice(0, 22);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim() || formData.name.trim().length < 3) {
      newErrors.name = "Full name must be at least 3 characters";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    } else if (!validateAge(formData.dob)) {
      newErrors.dob = "Devotee must be at least 18 years old";
    }
    if (!formData.addressLine.trim() || formData.addressLine.trim().length < 5) {
      newErrors.addressLine = "Detailed address is required (min 5 chars)";
    }
    if (!formData.addressCity.trim()) {
      newErrors.addressCity = "City is required";
    }
    if (!formData.addressPincode.trim() || formData.addressPincode.length !== 6) {
      newErrors.addressPincode = "Enter a valid 6-digit pincode";
    }
    if (!formData.idNumber.trim()) {
      newErrors.idNumber = "PAN number is required for accounting compliance";
    } else if (!validatePAN(formData.idNumber)) {
      newErrors.idNumber = "Invalid PAN format (e.g. ABCDE1234F)";
    }
    if (!formData.donationHeadId) {
      newErrors.donationHeadId = "Please select a seva cause";
    }
    const amt = parseInt(formData.amount);
    if (!amt || isNaN(amt) || amt < 1) {
      newErrors.amount = "Enter a valid donation amount";
    }
    if (formData.paymentMethod === "UPI" && !formData.utrNumber.trim()) {
      newErrors.utrNumber = "UTR reference number is required for UPI";
    }
    if (formData.paymentMethod === "CHEQUE") {
      if (!formData.chequeNumber.trim()) newErrors.chequeNumber = "Cheque number is required";
      if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required";
    }
    if (["RTGS", "NEFT"].includes(formData.paymentMethod)) {
      if (!formData.referenceNumber.trim()) newErrors.referenceNumber = `${formData.paymentMethod} reference number is required`;
      if (!formData.bankName.trim()) newErrors.bankName = "Bank name is required for bank transfer payments";
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
        (h) => String(h._id || h.id || h.key) === String(formData.donationHeadId)
      );
      const headName = getHeadName(selectedHead);

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
          id: String(selectedHead?._id || selectedHead?.id || selectedHead?.key || formData.donationHeadId),
          name: headName,
        },
        amount: parseInt(formData.amount),
        paymentDate: formData.paymentDate,
        paymentMethod: formData.paymentMethod,
      };

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
      if (["RTGS", "NEFT"].includes(formData.paymentMethod)) {
        payload.paymentDetails = { referenceNumber: formData.referenceNumber.trim(), bankName: formData.bankName.trim() };
      }

      const data = await financeApi.createOfflineDonation(payload);

      setSuccess({
        donationId: data.donationId,
        receiptNumber: data.receiptNumber,
        receiptUrl: data.receiptUrl,
        paymentMethod: data.paymentMethod || formData.paymentMethod,
        amount: parseInt(formData.amount),
        donorName: formData.anonymousDisplay ? "Anonymous (Gupt Seva)" : formData.name.trim(),
        causeName: headName,
        date: formData.paymentDate,
      });
    } catch (err) {
      console.error("Donation creation failed:", err);
      setSubmitError(err.message || "Failed to record donation. Please check details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!success?.donationId) return;
    try {
      await financeApi.downloadDonationReceipt(success.donationId, success.receiptNumber);
    } catch (err) {
      console.error("Receipt download error:", err);
      alert("Failed to download receipt PDF.");
    }
  };

  const resetForm = () => {
    setSuccess(null);
    setFormData({
      name: "",
      mobile: "",
      email: "",
      addressLine: "",
      addressCity: "",
      addressState: "Maharashtra",
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
      referenceNumber: "",
      chequeNumber: "",
      bankName: "",
      chequeDate: "",
    });
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seva Recorded Successfully!</h2>
          <p className="text-sm text-gray-500 mt-1">
            The donation has been saved in the ledger and assigned an official prefixed receipt.
          </p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-5 text-left space-y-3 font-mono text-sm">
          <div className="flex justify-between border-b border-amber-200/60 pb-2">
            <span className="text-gray-600 font-sans">Receipt Number:</span>
            <span className="font-bold text-amber-900">{success.receiptNumber || "Assigned"}</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/60 pb-2">
            <span className="text-gray-600 font-sans">Devotee Name:</span>
            <span className="font-semibold text-gray-900">{success.donorName}</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/60 pb-2">
            <span className="text-gray-600 font-sans">Seva Cause:</span>
            <span className="font-semibold text-gray-900">{success.causeName}</span>
          </div>
          <div className="flex justify-between border-b border-amber-200/60 pb-2">
            <span className="text-gray-600 font-sans">Payment Mode:</span>
            <span className="font-semibold text-blue-800">{success.paymentMethod}</span>
          </div>
          <div className="flex justify-between pt-1">
            <span className="text-gray-700 font-sans font-bold">Total Amount:</span>
            <span className="font-bold text-emerald-700 text-base">₹{success.amount.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <button
            type="button"
            onClick={handleDownloadReceipt}
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Official Receipt PDF
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition-colors"
          >
            Enter Another Seva
          </button>
        </div>

        <div className="pt-2">
          <Link to="/admin/trustee/donations" className="text-xs text-amber-700 hover:underline font-medium">
            ← Return to Donations Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/trustee/donations"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Register
        </Link>
        <span className="text-xs font-semibold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full">
          Trustee Counter Entry
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-8 py-6 text-white">
          <div className="flex items-center space-x-3">
            <Heart className="w-6 h-6 text-amber-200" />
            <h1 className="text-xl font-bold">Record Offline Devotee Donation</h1>
          </div>
          <p className="text-amber-100 text-xs mt-1">
            Generate an official tax-exempt receipt (with CA-, CH-, or UPI- prefix) for counter seva contributions.
          </p>
        </div>

        {submitError && (
          <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
            <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* 1. DONOR DETAILS */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              1. Devotee Information (KYC & Accounting)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Sharma"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Number (10 Digits)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-xs text-gray-400 font-medium">
                    +91
                  </span>
                  <input
                    type="text"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="devotee@example.com"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Date of Birth (Must be 18+) <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.dob ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Address Line <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine"
                  value={formData.addressLine}
                  onChange={handleChange}
                  placeholder="House/Flat No, Street, Landmark"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.addressLine ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.addressLine && <p className="mt-1 text-xs text-red-600">{errors.addressLine}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressCity"
                  value={formData.addressCity}
                  onChange={handleChange}
                  placeholder="e.g. Pune"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.addressCity ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.addressCity && <p className="mt-1 text-xs text-red-600">{errors.addressCity}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  State <span className="text-red-500">*</span>
                </label>
                <select
                  name="addressState"
                  value={formData.addressState}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressPincode"
                  value={formData.addressPincode}
                  onChange={handleChange}
                  placeholder="411001"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.addressPincode ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.addressPincode && <p className="mt-1 text-xs text-red-600">{errors.addressPincode}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  PAN Number (10 Alphanumeric) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="idNumber"
                  value={formData.idNumber}
                  onChange={handleChange}
                  placeholder="ABCDE1234F"
                  className={`w-full px-3.5 py-2 text-sm font-mono uppercase border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.idNumber ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                />
                {errors.idNumber && <p className="mt-1 text-xs text-red-600">{errors.idNumber}</p>}
              </div>
            </div>

            <div className="pt-2">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="anonymousDisplay"
                  checked={formData.anonymousDisplay}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="ml-2 text-xs text-gray-700">
                  <strong>Gupt Seva (Anonymous):</strong> Do not display donor name on public website leaderboards or ticker.
                </span>
              </label>
            </div>
          </div>

          {/* 2. DONATION & PAYMENT DETAILS */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">
              2. Seva Cause & Payment Mode
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Seva Cause / Head <span className="text-red-500">*</span>
                </label>
                <select
                  name="donationHeadId"
                  value={formData.donationHeadId}
                  onChange={handleChange}
                  disabled={loadingHeads}
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    errors.donationHeadId ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                  }`}
                >
                  <option value="">{loadingHeads ? "Loading active causes..." : "Select Seva Cause"}</option>
                  {donationHeads.map((head) => {
                    const idVal = head._id || head.id || head.key;
                    const nameVal = getHeadName(head);
                    return (
                      <option key={idVal} value={idVal}>
                        {nameVal}
                      </option>
                    );
                  })}
                </select>
                {errors.donationHeadId && <p className="mt-1 text-xs text-red-600">{errors.donationHeadId}</p>}
                {headsError && <p className="mt-1 text-xs text-amber-600">{headsError}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center font-bold text-gray-500">
                    ₹
                  </span>
                  <input
                    type="text"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="e.g. 5100"
                    className={`w-full pl-8 pr-3.5 py-2 text-sm font-bold text-gray-900 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.amount ? "border-red-300 focus:ring-red-500" : "border-gray-200 focus:ring-amber-500"
                    }`}
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white font-medium"
                >
                  {PAYMENT_METHODS.map((pm) => (
                    <option key={pm.value} value={pm.value}>
                      {pm.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1">
                  {formData.paymentMethod === "CASH" && "Generates receipt with CA- prefix."}
                  {formData.paymentMethod === "UPI" && "Generates receipt with UPI- prefix."}
                  {formData.paymentMethod === "CHEQUE" && "Generates receipt with CH- prefix."}
                  {["RTGS", "NEFT"].includes(formData.paymentMethod) && "Uses the established receipt-numbering sequence."}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Conditional: UPI UTR */}
              {formData.paymentMethod === "UPI" && (
                <div className="md:col-span-2 bg-green-50/50 p-4 rounded-xl border border-green-100">
                  <label className="block text-xs font-semibold text-green-800 uppercase tracking-wider mb-1">
                    UPI UTR / Reference Number (12 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="utrNumber"
                    value={formData.utrNumber}
                    onChange={handleChange}
                    placeholder="e.g. 308912345678"
                    className={`w-full px-3.5 py-2 text-sm font-mono border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                      errors.utrNumber ? "border-red-300 focus:ring-red-500" : "border-green-200 focus:ring-green-500"
                    }`}
                  />
                  {errors.utrNumber && <p className="mt-1 text-xs text-red-600">{errors.utrNumber}</p>}
                </div>
              )}

              {/* Conditional: CHEQUE DETAILS */}
              {formData.paymentMethod === "CHEQUE" && (
                <div className="md:col-span-2 bg-orange-50/50 p-4 rounded-xl border border-orange-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-orange-900 uppercase tracking-wider mb-1">
                      Cheque Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="chequeNumber"
                      value={formData.chequeNumber}
                      onChange={handleChange}
                      placeholder="000123"
                      className={`w-full px-3 py-1.5 text-sm font-mono border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                        errors.chequeNumber ? "border-red-300 focus:ring-red-500" : "border-orange-200 focus:ring-orange-500"
                      }`}
                    />
                    {errors.chequeNumber && <p className="mt-1 text-xs text-red-600">{errors.chequeNumber}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-orange-900 uppercase tracking-wider mb-1">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g. State Bank of India"
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 ${
                        errors.bankName ? "border-red-300 focus:ring-red-500" : "border-orange-200 focus:ring-orange-500"
                      }`}
                    />
                    {errors.bankName && <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-orange-900 uppercase tracking-wider mb-1">
                      Cheque Date
                    </label>
                    <input
                      type="date"
                      name="chequeDate"
                      value={formData.chequeDate}
                      onChange={handleChange}
                      className="w-full px-3 py-1.5 text-sm border border-orange-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              )}

              {["RTGS", "NEFT"].includes(formData.paymentMethod) && (
                <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">{formData.paymentMethod} Reference Number <span className="text-red-500">*</span></label>
                    <input type="text" name="referenceNumber" value={formData.referenceNumber} onChange={handleChange} placeholder={`Enter ${formData.paymentMethod} reference`} className={`w-full px-3 py-1.5 text-sm font-mono border rounded-lg bg-white focus:outline-none focus:ring-2 ${errors.referenceNumber ? "border-red-300 focus:ring-red-500" : "border-blue-200 focus:ring-blue-500"}`} />
                    {errors.referenceNumber && <p className="mt-1 text-xs text-red-600">{errors.referenceNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 uppercase tracking-wider mb-1">Bank Name <span className="text-red-500">*</span></label>
                    <input type="text" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="e.g. State Bank of India" className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 ${errors.bankName ? "border-red-300 focus:ring-red-500" : "border-blue-200 focus:ring-blue-500"}`} />
                    {errors.bankName && <p className="mt-1 text-xs text-red-600">{errors.bankName}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-6 border-t border-gray-100 flex items-center justify-end space-x-3">
            <Link
              to="/admin/trustee/donations"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || loadingHeads}
              className="px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 rounded-xl shadow-sm transition-all disabled:opacity-50 inline-flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Recording Seva...
                </>
              ) : (
                "Save & Issue Receipt"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfflineDonationForm;
