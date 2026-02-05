import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

/**
 * CollectorDetailView - Admin view of a specific collector's performance
 * 
 * Features:
 * - Collector stats and info
 * - List of attributed donations (no donor PII)
 * - Toggle enable/disable
 */
const CollectorDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collector, setCollector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  /**
   * Fetch collector details
   */
  const fetchCollector = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collectors/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Collector not found");
        }
        throw new Error("Failed to fetch collector details");
      }

      const data = await parseJsonResponse(response);
      setCollector(data);
    } catch (err) {
      console.error("Error fetching collector:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCollector();
  }, [fetchCollector]);

  /**
   * Toggle collector status
   */
  const handleToggleStatus = async () => {
    try {
      setToggling(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collectors/${id}/toggle-status`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const data = await parseJsonResponse(response);
      setCollector((prev) => ({
        ...prev,
        disabled: data.collector.disabled,
      }));
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Error toggling status:", err);
      alert("Failed to update collector status");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading collector details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => navigate("/admin/system/collectors")}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          ← Back to Collectors
        </button>
      </div>
    );
  }

  if (!collector) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/system/collectors")}
        className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Collectors
      </button>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{collector.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-mono">
              {collector.referralCode}
            </span>
            <StatusBadge disabled={collector.disabled} />
          </div>
        </div>
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={toggling}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            collector.disabled
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-red-600 text-white hover:bg-red-700"
          } disabled:opacity-50`}
        >
          {collector.disabled ? "Enable Collector" : "Disable Collector"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Collected"
          value={formatCurrency(collector.stats.totalAmount)}
          highlight
        />
        <StatCard
          label="Donations"
          value={collector.stats.donationCount}
        />
        <StatCard
          label="Completed"
          value={collector.stats.completedCount}
        />
        <StatCard
          label="Pending"
          value={collector.stats.pendingCount}
        />
      </div>

      {/* Recent Donations */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Donations
          </h2>
          <p className="text-sm text-gray-500">
            Last 50 donations attributed to this collector
          </p>
        </div>

        {collector.donations.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No donations yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donation ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cause
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {collector.donations.map((donation) => (
                  <tr key={donation.donationId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-600">
                        {donation.donationId}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(donation.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {donation.cause || "General"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="font-semibold text-amber-700">
                        {formatCurrency(donation.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <DonationStatusBadge status={donation.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <ConfirmModal
          title={collector.disabled ? "Enable Collector?" : "Disable Collector?"}
          message={
            collector.disabled
              ? `This will allow "${collector.name}" to attribute donations again. Their referral code will become active.`
              : `This will prevent "${collector.name}" from attributing new donations. Existing donations will remain attributed to them.`
          }
          confirmLabel={collector.disabled ? "Enable" : "Disable"}
          confirmVariant={collector.disabled ? "success" : "danger"}
          onConfirm={handleToggleStatus}
          onCancel={() => setShowConfirmModal(false)}
          loading={toggling}
        />
      )}
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard = ({ label, value, highlight = false }) => (
  <div className="bg-white rounded-lg shadow-md border border-gray-200 p-5">
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${highlight ? "text-amber-700" : "text-gray-900"}`}>
      {value}
    </p>
  </div>
);

/**
 * Status Badge Component
 */
const StatusBadge = ({ disabled }) => {
  return disabled ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      Disabled
    </span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
      Active
    </span>
  );
};

/**
 * Donation Status Badge
 */
const DonationStatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    failed: "bg-red-100 text-red-800",
    refunded: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] || styles.pending
      }`}
    >
      {status}
    </span>
  );
};

/**
 * Confirmation Modal
 */
const ConfirmModal = ({
  title,
  message,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
  loading,
}) => {
  const buttonStyles = {
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-md text-sm font-medium ${buttonStyles[confirmVariant]} disabled:opacity-50`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollectorDetailView;
