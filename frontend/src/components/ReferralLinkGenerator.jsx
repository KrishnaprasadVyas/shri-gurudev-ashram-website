import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { donationHeads, presetAmounts } from "../data/dummyData";
import { formatCurrency } from "../utils/helpers";
import { useTranslation } from "react-i18next";

/**
 * ReferralLinkGenerator - WhatsApp-friendly referral link generator for collectors
 *
 * Features:
 * - Simple referral link (just ref code)
 * - Editable link with cause and suggested amount
 * - Auto-generated WhatsApp message with copy functionality
 * - No history storage - links generated on-the-fly
 * - Minimum amount enforcement for specific causes (e.g., Ashram Nirman ₹5000)
 */
const ReferralLinkGenerator = ({ referralCode, collectorName }) => {
  const [selectedCause, setSelectedCause] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [amountError, setAmountError] = useState("");

  // Get minimum amount for selected cause
  const selectedCauseData = useMemo(() => {
    return donationHeads.find((head) => head.name === selectedCause);
  }, [selectedCause]);

  const minAmount = selectedCauseData?.minAmount || 0;

  // Validate amount when cause or amount changes
  useEffect(() => {
    const currentAmount = parseInt(customAmount || selectedAmount) || 0;
    if (minAmount > 0 && currentAmount > 0 && currentAmount < minAmount) {
      setAmountError(
        `Minimum donation for ${selectedCause} is ${formatCurrency(minAmount)}`,
      );
    } else {
      setAmountError("");
    }
  }, [selectedCause, selectedAmount, customAmount, minAmount]);

  const [copied, setCopied] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const { t } = useTranslation();

  // Get the base URL for donation page
  const baseUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/donate`;
  }, []);

  // Generate the referral link based on selections
  const referralLink = useMemo(() => {
    if (!referralCode) return null;

    const params = new URLSearchParams();
    params.set("ref", referralCode);

    if (selectedCause) {
      params.set("cause", selectedCause);
    }

    const amount = customAmount || selectedAmount;
    if (amount) {
      params.set("amount", amount);
    }

    return `${baseUrl}?${params.toString()}`;
  }, [referralCode, selectedCause, selectedAmount, customAmount, baseUrl]);

  // Simple link (just referral code)
  const simpleLink = useMemo(() => {
    if (!referralCode) return null;
    return `${baseUrl}?ref=${referralCode}`;
  }, [referralCode, baseUrl]);

  // Generate WhatsApp-formatted message with emotionally engaging content
  const whatsappMessage = useMemo(() => {
    if (!referralLink) return "";

    const causeName = selectedCause || "";
    const amount = customAmount || selectedAmount;

    // Short, clean WhatsApp message
    let message = "";
    message += "Jai Gurudev!\n\n";

    message += "Shri Gurudev Ashram ki seva mein aapka swagat hai.\n\n";

    if (selectedCause) {
      message += `Seva: *${causeName}*\n\n`;
    }

    if (amount) {
      message += `Rashi: Rs. ${parseInt(amount).toLocaleString("en-IN")}\n\n`;
    }

    message += "Daan karein:\n";
    message += `${referralLink}\n\n`;

    message += "Aapka sahyog bahut maayne rakhta hai.\n\n";
    message += "Dhanyavaad!";

    return message;
  }, [referralLink, selectedCause, selectedAmount, customAmount]);

  // Copy link to clipboard
  const copyLink = useCallback(async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [referralLink]);

  // Copy WhatsApp message to clipboard
  const copyMessage = useCallback(async () => {
    if (!whatsappMessage) return;

    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [whatsappMessage]);

  // Open WhatsApp with pre-filled message
  const shareViaWhatsApp = useCallback(() => {
    if (!whatsappMessage) return;

    const encoded = encodeURIComponent(whatsappMessage);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  }, [whatsappMessage]);

  // Handle custom amount input
  const handleCustomAmount = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setCustomAmount(value);
    if (value) {
      setSelectedAmount(""); // Clear preset if custom is entered
    }
  };

  // Handle preset amount selection
  const handlePresetAmount = (amount) => {
    setSelectedAmount(amount.toString());
    setCustomAmount(""); // Clear custom if preset is selected
  };

  if (!referralCode) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <p className="text-gray-600">{t("referral.codeGenerating")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-amber-900 mb-2">
          {t("referral.shareTitle")}
        </h3>
        <p className="text-gray-600 text-sm">
          {t("referral.shareDescription")}
        </p>
      </div>

      {/* Your Referral Code Display */}
      <div className="bg-amber-50 rounded-lg p-4 text-center">
        <p className="text-sm text-amber-700 mb-1">{t("referral.yourCode")}</p>
        <p className="text-2xl font-bold text-amber-900 font-mono tracking-wider">
          {referralCode}
        </p>
      </div>

      {/* Simple Link Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-2">
          {t("referral.simpleLink")}
        </h4>
        <div className="flex gap-2">
          <input
            type="text"
            readOnly
            value={simpleLink || ""}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 truncate"
          />
          <button
            onClick={() => {
              navigator.clipboard.writeText(simpleLink || "");
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm font-medium"
          >
            {copied ? t("referral.copied") : t("referral.copy")}
          </button>
        </div>
      </div>

      {/* Customizable Link Section */}
      <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50">
        <h4 className="font-semibold text-amber-900 mb-4">
          {t("referral.customizeLink")}
        </h4>

        {/* Cause Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("referral.selectCause")}
          </label>
          <select
            value={selectedCause}
            onChange={(e) => {
              setSelectedCause(e.target.value);
              // Reset amount selection when cause changes to avoid invalid amounts
              setSelectedAmount("");
              setCustomAmount("");
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          >
            <option value="">{t("referral.anyCause")}</option>
            {donationHeads.map((head) => (
              <option key={head.id} value={head.name}>
                {head.name}
                {head.minAmount
                  ? ` (Min: ${formatCurrency(head.minAmount)})`
                  : ""}
              </option>
            ))}
          </select>
          {minAmount > 0 && (
            <p className="text-xs text-amber-700 mt-1">
              {t("referral.minDonationWarning", {
                cause: selectedCause,
                amount: formatCurrency(minAmount),
              })}
            </p>
          )}
        </div>

        {/* Amount Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("referral.suggestedAmount")}
          </label>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {presetAmounts
              .filter((amount) => amount >= minAmount) // Filter out amounts below minimum
              .slice(0, 6)
              .map((amount) => (
                <button
                  key={amount}
                  onClick={() => handlePresetAmount(amount)}
                  className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                    selectedAmount === amount.toString()
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-amber-400"
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
          </div>
          <input
            type="text"
            inputMode="numeric"
            placeholder={
              minAmount > 0
                ? t("referral.enterAmountMin", {
                    amount: formatCurrency(minAmount),
                  })
                : t("referral.enterCustomAmount")
            }
            value={customAmount}
            onChange={handleCustomAmount}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
              amountError ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
          />
          {amountError && (
            <p className="text-xs text-red-600 mt-1">{amountError}</p>
          )}
        </div>

        {/* Generated Link */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("referral.customizedLink")}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={referralLink || ""}
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm text-gray-700 truncate"
            />
            <button
              onClick={copyLink}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors text-sm font-medium"
            >
              {copied ? t("referral.copied") : t("referral.copy")}
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Section */}
      <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {t("referral.whatsappMessage")}
        </h4>

        <div className="bg-white rounded-lg p-3 mb-3 border border-green-200">
          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
            {whatsappMessage}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={copyMessage}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {copiedMessage ? t("referral.copied") : t("referral.copyMessage")}
          </button>
          <button
            onClick={shareViaWhatsApp}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            {t("referral.shareWhatsApp")}
          </button>
        </div>
      </div>

      {/* Info Note */}
      <p className="text-xs text-gray-500 text-center">
        {t("referral.attributionNote")}
      </p>
    </div>
  );
};

export default ReferralLinkGenerator;
