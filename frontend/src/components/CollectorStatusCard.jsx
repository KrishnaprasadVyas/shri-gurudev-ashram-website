import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * CollectorStatusCard - Displays collector application status
 *
 * States:
 * - none/user: Show apply button
 * - pending: Show pending message
 * - approved: Show success message with dashboard link
 * - rejected: Show rejection reason with reapply button
 */
const CollectorStatusCard = ({
  role,
  collectorProfile,
  onApply,
  className = "",
}) => {
  const { t } = useTranslation();
  const status = collectorProfile?.status || "none";

  // User role - show apply button
  if (role === "USER" && status === "none") {
    return (
      <div
        className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 ${className}`}
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-amber-600"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("collector.statusCard.becomeCollector")}
          </h3>
          <p className="text-gray-600 mb-6 text-sm">
            {t("collector.statusCard.applyNote")}
          </p>
          <Link
            to="/collector/apply"
            className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
          >
            {t("collector.statusCard.applyBtn")}
          </Link>
        </div>
      </div>
    );
  }

  // Pending state
  if (role === "COLLECTOR_PENDING" || status === "pending") {
    return (
      <div
        className={`bg-white rounded-xl shadow-md p-6 border border-yellow-200 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("collector.statusCard.underReview")}
              </h3>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                {t("collector.statusCard.pending")}
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              {t("collector.statusCard.reviewNote")}
            </p>
            {collectorProfile?.submittedAt && (
              <p className="text-gray-500 text-xs mt-3">
                {t("collector.statusCard.submittedOn", {
                  date: new Date(
                    collectorProfile.submittedAt,
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }),
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Approved state
  if (role === "COLLECTOR_APPROVED" || status === "approved") {
    return (
      <div
        className={`bg-white rounded-xl shadow-md p-6 border border-green-200 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("collector.statusCard.verified")}
              </h3>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                {t("collector.statusCard.approved")}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {t("collector.statusCard.approvedNote")}
            </p>
            <Link
              to="/collector"
              className="inline-flex items-center text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {t("collector.statusCard.goToDashboard")}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Rejected state - allow reapply
  if (status === "rejected") {
    return (
      <div
        className={`bg-white rounded-xl shadow-md p-6 border border-red-200 ${className}`}
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("collector.statusCard.rejected")}
              </h3>
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                {t("collector.statusCard.rejectedLabel")}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {t("collector.statusCard.rejectedNote")}
            </p>
            {collectorProfile?.rejectedReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800">
                  <span className="font-medium">
                    {t("collector.statusCard.reason")}{" "}
                  </span>
                  {collectorProfile.rejectedReason}
                </p>
              </div>
            )}
            <Link
              to="/collector/reapply"
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors text-sm"
            >
              {t("collector.statusCard.reapply")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback - show apply button
  return (
    <div
      className={`bg-white rounded-xl shadow-md p-6 border border-gray-100 ${className}`}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-amber-600"
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
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t("collector.statusCard.becomeCollector")}
        </h3>
        <p className="text-gray-600 mb-6 text-sm">
          {t("collector.statusCard.applyNote")}
        </p>
        <Link
          to="/collector/apply"
          className="inline-flex items-center justify-center px-6 py-3 bg-amber-600 text-white font-medium rounded-lg hover:bg-amber-700 transition-colors"
        >
          {t("collector.statusCard.applyBtn")}
        </Link>
      </div>
    </div>
  );
};

export default CollectorStatusCard;
