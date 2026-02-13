import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import PrimaryButton from "../components/PrimaryButton";
import CollectorStatusCard from "../components/CollectorStatusCard";
import { formatCurrency } from "../utils/helpers";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";
import { useTranslation } from "react-i18next";

const MyDonations = () => {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  /**
   * Fetch user donations
   */
  const fetchDonations = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/user/donations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError(t("myDonations.sessionExpired"));
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch donations");
      }

      const data = await parseJsonResponse(response);
      setDonations(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  /**
   * Fetch donations on mount and when token changes
   */
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDonations();
    } else if (!authLoading && !isAuthenticated) {
      setIsLoading(false);
    }
  }, [authLoading, isAuthenticated, fetchDonations]);

  /**
   * Download receipt for a donation
   */
  const handleDownloadReceipt = async (donationId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/donations/${donationId}/receipt`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${donationId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert(t("myDonations.receiptNotAvailable"));
      }
    } catch (err) {
      alert(t("myDonations.receiptDownloadFailed"));
    }
  };

  /**
   * Render status badge
   */
  const StatusBadge = ({ status }) => {
    const { t } = useTranslation();
    const styles = {
      SUCCESS: "bg-green-100 text-green-800",
      PENDING: "bg-amber-100 text-amber-800",
      FAILED: "bg-red-100 text-red-800",
    };

    const labels = {
      SUCCESS: t("myDonations.statusConfirmed"),
      PENDING: t("myDonations.statusProcessing"),
      FAILED: t("myDonations.statusFailed"),
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full ${
          styles[status] || styles.PENDING
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  /**
   * Loading skeleton component
   */
  const DonationSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm animate-pulse"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-5 w-32 bg-gray-200 rounded"></div>
                <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-8 w-24 bg-gray-200 rounded mt-2"></div>
              <div className="h-4 w-40 bg-gray-200 rounded mt-2"></div>
            </div>
            <div className="h-10 w-36 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Show loading while auth is being checked
  if (authLoading || isLoading) {
    return (
      <section className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            title={t("myDonations.title")}
            subtitle={t("myDonations.viewHistory")}
            center={true}
          />
          <DonationSkeleton />
        </div>
      </section>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <section className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title={t("myDonations.title")} center={true} />
          <div className="text-center py-12 bg-amber-50 rounded-lg border border-amber-200">
            <svg
              className="w-16 h-16 mx-auto text-amber-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("myDonations.loginRequired")}
            </h3>
            <p className="text-gray-600 mb-6">{t("myDonations.loginToView")}</p>
            <Link to="/login" state={{ from: "/my-donations" }}>
              <PrimaryButton>{t("myDonations.loginToContinue")}</PrimaryButton>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <section className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title={t("myDonations.title")} center={true} />
          <div className="text-center py-12 bg-red-50 rounded-lg border border-red-200">
            <svg
              className="w-16 h-16 mx-auto text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t("myDonations.somethingWrong")}
            </h3>
            <p className="text-red-600 mb-6">{error}</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={fetchDonations}
                className="px-6 py-2 bg-amber-600 text-white rounded-md font-medium hover:bg-amber-700 transition-colors"
              >
                {t("myDonations.tryAgain")}
              </button>
              <Link
                to="/login"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                {t("myDonations.loginAgain")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header with user info */}
        <div className="mb-8">
          <SectionHeading
            title={t("myDonations.title")}
            subtitle={t("myDonations.welcomeBack", {
              name: user?.fullName ? `, ${user.fullName}` : "",
            })}
            center={true}
          />
        </div>

        {/* Empty state */}
        {donations.length === 0 ? (
          <div className="text-center py-12 bg-amber-50 rounded-lg border border-amber-200">
            <svg
              className="w-20 h-20 mx-auto text-amber-300 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {t("myDonations.noDonations")}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t("myDonations.noDonationsNote")}
            </p>
            <Link to="/donate">
              <PrimaryButton>
                {t("myDonations.makeFirstDonation")}
              </PrimaryButton>
            </Link>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-700">
                  {donations.filter((d) => d.status === "SUCCESS").length}
                </p>
                <p className="text-sm text-green-600">
                  {t("myDonations.successfulDonations")}
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {formatCurrency(
                    donations
                      .filter((d) => d.status === "SUCCESS")
                      .reduce((sum, d) => sum + d.amount, 0),
                  )}
                </p>
                <p className="text-sm text-amber-600">
                  {t("myDonations.totalDonated")}
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-700">
                  {donations.length}
                </p>
                <p className="text-sm text-blue-600">
                  {t("myDonations.totalTransactions")}
                </p>
              </div>
            </div>

            {/* Collector Status Card */}
            <CollectorStatusCard
              role={user?.role}
              collectorProfile={user?.collectorProfile}
              className="mb-8"
            />

            {/* Donations list */}
            <div className="space-y-4">
              {donations.map((donation) => (
                <div
                  key={donation._id}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-amber-900">
                          {donation.donationHead?.name || donation.donationHead}
                        </h3>
                        <StatusBadge status={donation.status} />
                      </div>
                      <p className="text-2xl font-bold text-amber-700">
                        {formatCurrency(donation.amount)}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mt-1">
                        <span>
                          {new Date(donation.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        {donation.receiptNumber && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-xs">
                              {donation.receiptNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {donation.status === "SUCCESS" && donation.receiptUrl && (
                        <button
                          onClick={() => handleDownloadReceipt(donation._id)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          {t("myDonations.downloadReceipt")}
                        </button>
                      )}
                      {donation.status === "PENDING" && (
                        <span className="text-sm text-amber-600">
                          {t("myDonations.processing")}
                        </span>
                      )}
                      {donation.status === "FAILED" && (
                        <Link to="/donate">
                          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                            {t("myDonations.retry")}
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
          <Link to="/donate">
            <PrimaryButton>{t("myDonations.makeAnother")}</PrimaryButton>
          </Link>
          <Link
            to="/"
            className="text-amber-600 hover:text-amber-700 font-medium text-sm"
          >
            {t("myDonations.backToHome")}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MyDonations;
