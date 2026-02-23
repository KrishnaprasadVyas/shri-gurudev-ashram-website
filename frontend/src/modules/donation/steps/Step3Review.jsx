import { useTranslation } from "react-i18next";
import PrimaryButton from "../../../components/PrimaryButton";
import { formatCurrency } from "../../../utils/helpers";

const Step3Review = ({ data, updateData, nextStep, prevStep }) => {
  const { t } = useTranslation();
  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-amber-900 mb-6 text-center">
        {t("donation.step3.reviewTitle")}
      </h2>

      <div className="space-y-6">
        {/* Donation Summary */}
        <div className="bg-amber-50 rounded-lg p-6">
          <h3 className="font-bold text-amber-900 mb-4 text-lg">
            {t("donation.step3.donationSummary")}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-700">{t("donation.step3.cause")}</span>
              <span className="font-semibold text-amber-900">
                {data.donationHead?.name || t("donation.step3.notProvided")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">
                {t("donation.step3.amount")}
              </span>
              <span className="font-bold text-amber-700 text-lg">
                {formatCurrency(data.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Donor Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">
            {t("donation.step3.donorInfo")}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("donation.step3.fullName")}
              </span>
              <span className="font-semibold text-gray-900">
                {data.name || t("donation.step3.notProvided")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("donation.step3.mobileNumber")}
              </span>
              <span className="font-semibold text-gray-900">
                {data.mobile || t("donation.step3.notProvided")}
              </span>
            </div>
            {data.emailOptIn && data.email && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t("donation.step3.emailLabel")}
                </span>
                <span className="font-semibold text-gray-900">
                  {data.email}
                  {data.emailVerified && (
                    <span className="ml-2 text-green-600 text-xs">
                      {t("donation.step3.verified")}
                    </span>
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">
                {t("donation.step3.addressLabel")}
              </span>
              <span className="font-semibold text-gray-900 text-right max-w-xs">
                {[data.addressLine, data.addressCity, data.addressState, data.addressPincode, data.addressCountry]
                  .filter(Boolean)
                  .join(", ") || t("donation.step3.notProvided")}
              </span>
            </div>
            {data.pan && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {t("donation.step3.panLabel")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {data.pan}
                  </span>
                </div>
                {data.dateOfBirth && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth:</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(data.dateOfBirth).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </>
            )}
            {data.anonymousDisplay && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {t("donation.step3.publicDisplay")}
                </span>
                <span className="font-semibold text-gray-900">
                  {t("donation.step3.anonymous")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Total Amount Highlight */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg p-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">
              {t("donation.step3.totalAmount")}
            </span>
            <span className="text-3xl font-bold">
              {formatCurrency(data.amount)}
            </span>
          </div>
          {/* Show collector attribution if present */}
          {data.collectorName && (
            <div className="mt-3 pt-3 border-t border-amber-500/30 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-amber-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-amber-100 text-sm">
                {t("donation.step3.collectedBy")}{" "}
                <span className="font-semibold text-white">
                  {data.collectorName}
                </span>
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <PrimaryButton
            type="button"
            onClick={prevStep}
            variant="outline"
            className="flex-1"
          >
            {t("donation.step3.back")}
          </PrimaryButton>
          <PrimaryButton onClick={nextStep} className="flex-1">
            {t("donation.step3.proceed")}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
};

export default Step3Review;
