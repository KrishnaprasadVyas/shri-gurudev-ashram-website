import { useState, useMemo } from "react";
import PrimaryButton from "../../../components/PrimaryButton";
import { presetAmounts } from "../../../data/dummyData";
import { formatCurrency } from "../../../utils/helpers";

const Step1AmountSelection = ({ data, updateData, nextStep }) => {
  const [errors, setErrors] = useState({});

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
    if (!data.donationHead || !data.donationHead.id || !data.donationHead.name) {
      newErrors.cause = "Please select a donation cause first";
    }

    if (!data.amount || data.amount < 1) {
      newErrors.amount = "Please enter a donation amount";
    } else if (data.amount < minAmount) {
      newErrors.amount = `Minimum donation amount for ${data.donationHead?.name || "this cause"} is ${formatCurrency(minAmount)}`;
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      nextStep();
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        Select Donation Amount
      </h2>

      {/* Minimum Amount Notice */}
      {minAmount > 10 && (
        <div className="mb-6 p-4 bg-amber-100 border border-amber-300 rounded-lg">
          <div className="flex items-center gap-2 text-amber-800">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">
              Minimum donation for {data.donationHead?.name}: {formatCurrency(minAmount)}
            </span>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Amount Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Donation Amount <span className="text-red-500">*</span>
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
              Or enter custom amount {minAmount > 10 && `(min. ${formatCurrency(minAmount)})`}:
            </label>
            <input
              type="text"
              value={data.customAmount}
              onChange={handleCustomAmount}
              placeholder={`Enter amount (min. ${formatCurrency(minAmount)})`}
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
                  Total Amount:
                </span>
                <span className="text-2xl font-bold text-amber-700">
                  {formatCurrency(data.amount)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4">
          <PrimaryButton
            onClick={handleSubmit}
            disabled={!data.amount || data.amount < minAmount || !data.donationHead}
            className="w-full"
          >
            Continue
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default Step1AmountSelection;
