import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import SectionHeading from "../components/SectionHeading";
import PrimaryButton from "../components/PrimaryButton";
import { formatCurrency } from "../utils/helpers";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Get JWT token from localStorage
   */
  const getAuthToken = () => localStorage.getItem("token");

  /**
   * Fetch user donations on mount
   */
  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const token = getAuthToken();

        if (!token) {
          setError("Please login to view your donations");
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/user/donations`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          setError("Session expired. Please login again.");
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch donations");
        }

        const data = await response.json();
        setDonations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDonations();
  }, []);

  /**
   * Download receipt for a donation
   */
  const handleDownloadReceipt = async (donationId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/donations/${donationId}/receipt`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
        alert("Receipt not available yet.");
      }
    } catch (err) {
      alert("Failed to download receipt.");
    }
  };

  /**
   * Render status badge
   */
  const StatusBadge = ({ status }) => {
    const styles = {
      SUCCESS: "bg-green-100 text-green-800",
      PENDING: "bg-amber-100 text-amber-800",
      FAILED: "bg-red-100 text-red-800",
    };

    const labels = {
      SUCCESS: "Confirmed",
      PENDING: "Processing",
      FAILED: "Failed",
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

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title="My Donations" center={true} />
          <div className="flex justify-center items-center py-12">
            <svg
              className="animate-spin h-8 w-8 text-amber-600"
              xmlns="http://www.w3.org/2000/svg"
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
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 px-4 bg-white min-h-screen">
        <div className="max-w-4xl mx-auto">
          <SectionHeading title="My Donations" center={true} />
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Link to="/login">
              <PrimaryButton>Login</PrimaryButton>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          title="My Donations"
          subtitle="View your donation history"
          center={true}
        />

        {donations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              You haven&apos;t made any donations yet.
            </p>
            <Link to="/donate">
              <PrimaryButton>Make a Donation</PrimaryButton>
            </Link>
          </div>
        ) : (
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
                        {donation.donationHead}
                      </h3>
                      <StatusBadge status={donation.status} />
                    </div>
                    <p className="text-2xl font-bold text-amber-700">
                      {formatCurrency(donation.amount)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(donation.createdAt).toLocaleDateString(
                        "en-IN",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
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
                        Download Receipt
                      </button>
                    )}
                    {donation.status === "PENDING" && (
                      <span className="text-sm text-amber-600">
                        Processing...
                      </span>
                    )}
                    {donation.status === "FAILED" && (
                      <Link to="/donate">
                        <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                          Retry
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/donate">
            <PrimaryButton>Make Another Donation</PrimaryButton>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MyDonations;
