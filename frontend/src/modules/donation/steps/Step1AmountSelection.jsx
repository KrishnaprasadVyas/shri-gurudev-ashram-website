import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import PrimaryButton from "../../../components/PrimaryButton";
import { presetAmounts } from "../../../data/dummyData";
import { formatCurrency } from "../../../utils/helpers";
import { API_BASE_URL } from "../../../utils/api";

const Step1AmountSelection = ({ data, updateData, nextStep }) => {
  const { t } = useTranslation();
  const [errors, setErrors] = useState({});

  // Manual referral code input state (only when no URL referral)
  const [manualReferralCode, setManualReferralCode] = useState("");
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralError, setReferralError] = useState("");

  // Get minimum amount from selected cause, default to 10
  const minAmount = useMemo(() => {
    return data.donationHead?.minAmount || 10;
  }, [data.donationHead]);

  // Filter preset amounts to only show those >= minAmount
  const filteredPresetAmounts = useMemo(() => {
    return presetAmounts.filter((amount) => amount >= minAmount);
  }, [minAmount]);

  // Clear donation IDs when amount changes (invalidates previous order)
  const clearDonationIds = () => {
    if (data.donationId || data.razorpayOrderId) {
      updateData({
        donationId: null,
        razorpayOrderId: null,
        razorpayOrderAmount: null,
        razorpayKey: null,
      });
    }
  };

  // Validate manual referral code
  const validateManualReferral = useCallback(async () => {
    if (!manualReferralCode.trim()) {
      // Clear referral if input is empty
      updateData({ referralCode: null, collectorName: null });
      setReferralError("");
      return;
    }

    const code = manualReferralCode.trim().toUpperCase();
    setReferralValidating(true);
    setReferralError("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/public/referral/${encodeURIComponent(code)}`,
      );
      const result = await response.json();

      if (result.valid && result.collectorName) {
        updateData({
          referralCode: code,
          collectorName: result.collectorName,
        });
        setReferralError("");
      } else {
        updateData({ referralCode: null, collectorName: null });
        setReferralError(t("donation.step1.referralNotFound"));
      }
    } catch (error) {
      console.warn("Referral validation error:", error);
      updateData({ referralCode: null, collectorName: null });
      setReferralError("");
    } finally {
      setReferralValidating(false);
    }
  }, [manualReferralCode, updateData]);

  const handlePresetAmount = (amount) => {
    clearDonationIds();
    updateData({ amount, customAmount: "" });
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  const handleCustomAmount = (e) => {
    const value = e.target.value.replace(/\D/g, "");
    clearDonationIds();
    updateData({ customAmount: value, amount: value ? parseInt(value) : 0 });
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  const handleSubmit = () => {
    const newErrors = {};

    // Validate donation cause is selected
    if (
      !data.donationHead ||
      !data.donationHead.id ||
      !data.donationHead.name
    ) {
      newErrors.cause = t("donation.step1.selectCauseFirst");
    }

    if (!data.amount || data.amount < 1) {
      newErrors.amount = t("donation.step1.enterAmount");
    } else if (data.amount < minAmount) {
      newErrors.amount = t("donation.step1.minAmount", {
        cause: data.donationHead?.name || "this cause",
        amount: formatCurrency(minAmount),
      });
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        {t("donation.step1.selectAmount")}
      </h2>

      {/* Minimum Amount Notice */}
      {minAmount > 10 && (
        <div className="mb-6 p-4 bg-amber-100 border border-amber-300 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">
              {t("donation.step1.minAmount", {
                cause: data.donationHead?.name,
                amount: formatCurrency(minAmount),
              })}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            {t("donation.step1.donationAmount")}{" "}
            <span className="text-red-500">*</span>
          </label>

          {/* Preset Amounts */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
            {filteredPresetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetAmount(amount)}
                className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                  data.amount === amount && !data.customAmount
                    ? "border-amber-600 bg-amber-50 text-amber-900"
                    : "border-gray-200 hover:border-amber-300 bg-white text-gray-700"
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              {t("donation.step1.orCustom")}{" "}
              {minAmount > 10 &&
                `(${t("donation.step1.minCustom", { amount: formatCurrency(minAmount) })})`}
              :
            </label>
            <input
              type="text"
              value={data.customAmount}
              onChange={handleCustomAmount}
              placeholder={`${t("donation.step1.enterAmount")} (${t("donation.step1.minCustom", { amount: formatCurrency(minAmount) })})`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          {errors.cause && (
            <p className="mt-2 text-sm text-red-600">{errors.cause}</p>
          )}
          {errors.amount && (
            <p className="mt-2 text-sm text-red-600">{errors.amount}</p>
          )}

          {data.amount > 0 && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-amber-900">
                  {t("donation.step1.totalAmount")}
                </span>
                <span className="text-2xl font-bold text-amber-700">
                  {formatCurrency(data.amount)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Referral Code Section - Only show if no referral from URL */}
        {!data.referralCode && (
          <div className="border-t border-gray-200 pt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("donation.step1.haveReferral")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualReferralCode}
                onChange={(e) =>
                  setManualReferralCode(e.target.value.toUpperCase())
                }
                placeholder="e.g., COL7X9K2"
                maxLength={8}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono tracking-wider uppercase"
              />
              <button
                type="button"
                onClick={validateManualReferral}
                disabled={referralValidating || !manualReferralCode.trim()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {referralValidating
                  ? t("donation.step1.checking")
                  : t("donation.step1.applyBtn")}
              </button>
            </div>
            {referralError && (
              <p className="mt-2 text-sm text-amber-600">{referralError}</p>
            )}
          </div>
        )}

        {/* Show validated collector info */}
        {data.collectorName && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="text-green-800 font-medium">
                {t("donation.step1.collectedBy")}{" "}
                <span className="font-bold">{data.collectorName}</span>
              </p>
            </div>
          </div>
        )}

        <div className="pt-4">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={
              !data.amount || data.amount < minAmount || !data.donationHead
            }
            className="w-full"
          >
            {t("donation.step1.continue")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default Step1AmountSelection;
