import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

/**
 * CollectorApplicationsView - Admin page to view and manage collector KYC applications
 * 
 * Features:
 * - View pending, approved, rejected applications
 * - Filter by status
 * - View KYC documents (Aadhar front/back)
 * - Approve or reject pending applications
 */
const CollectorApplicationsView = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [selectedApp, setSelectedApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [kycImages, setKycImages] = useState({ front: null, back: null });
  const [kycLoading, setKycLoading] = useState(false);

  /**
   * Fetch applications with filter
   */
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Authentication required");
        return;
      }

      const url = filter === "all" 
        ? `${API_BASE_URL}/admin/system/collector-applications`
        : `${API_BASE_URL}/admin/system/collector-applications?status=${filter}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await parseJsonResponse(response);
      setApplications(data.applications || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  /**
   * Fetch KYC document images for selected application
   */
  const fetchKycImages = async (userId) => {
    try {
      setKycLoading(true);
      const token = localStorage.getItem("token");

      const [frontRes, backRes] = await Promise.all([
        fetch(`${API_BASE_URL}/admin/system/collector/${userId}/kyc/front`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/admin/system/collector/${userId}/kyc/back`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const frontUrl = frontRes.ok ? URL.createObjectURL(await frontRes.blob()) : null;
      const backUrl = backRes.ok ? URL.createObjectURL(await backRes.blob()) : null;

      setKycImages({ front: frontUrl, back: backUrl });
    } catch (err) {
      console.error("Error fetching KYC images:", err);
    } finally {
      setKycLoading(false);
    }
  };

  /**
   * Handle selecting an application to view details
   */
  const handleSelectApp = (app) => {
    setSelectedApp(app);
    setKycImages({ front: null, back: null });
    if (app) {
      fetchKycImages(app.userId);
    }
  };

  /**
   * Approve application
   */
  const handleApprove = async () => {
    if (!selectedApp) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collector/${selectedApp.userId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const data = await parseJsonResponse(response);
        throw new Error(data.message || "Failed to approve");
      }

      // Refresh list and close detail view
      await fetchApplications();
      setSelectedApp(null);
    } catch (err) {
      console.error("Error approving application:", err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Reject application
   */
  const handleReject = async () => {
    if (!selectedApp || !rejectReason.trim()) return;

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collector/${selectedApp.userId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: rejectReason.trim() }),
        }
      );

      if (!response.ok) {
        const data = await parseJsonResponse(response);
        throw new Error(data.message || "Failed to reject");
      }

      // Refresh list and close modals
      await fetchApplications();
      setSelectedApp(null);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err) {
      console.error("Error rejecting application:", err);
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  if (loading && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchApplications}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Collector Applications</h1>
        
        {/* Filter Tabs */}
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Applications List */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-200">
            {applications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No {filter === "all" ? "" : filter} applications found.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {applications.map((app) => (
                  <div
                    key={app.userId}
                    onClick={() => handleSelectApp(app)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedApp?.userId === app.userId ? "bg-amber-50 border-l-4 border-amber-600" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{app.fullName}</h3>
                        <p className="text-sm text-gray-500">{app.mobile}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                          {app.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(app.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Application Detail Panel */}
        {selectedApp && (
          <div className="w-96 bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Applicant Info */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-gray-500 uppercase">Full Name</label>
                <p className="font-medium text-gray-900">{selectedApp.fullName}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Mobile</label>
                <p className="font-medium text-gray-900">{selectedApp.mobile}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Address</label>
                <p className="text-sm text-gray-700">{selectedApp.address}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">PAN Number</label>
                <p className="font-mono text-gray-900">{selectedApp.panNumber}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase">Status</label>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedApp.status)}`}>
                  {selectedApp.status}
                </span>
              </div>
              {selectedApp.rejectedReason && (
                <div>
                  <label className="text-xs text-gray-500 uppercase">Rejection Reason</label>
                  <p className="text-sm text-red-600">{selectedApp.rejectedReason}</p>
                </div>
              )}
            </div>

            {/* KYC Documents */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Aadhar Card</h3>
              {kycLoading ? (
                <div className="flex items-center justify-center h-32 bg-gray-100 rounded-lg">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Front</p>
                    {kycImages.front ? (
                      <img
                        src={kycImages.front}
                        alt="Aadhar Front"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(kycImages.front, "_blank")}
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Not available
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Back</p>
                    {kycImages.back ? (
                      <img
                        src={kycImages.back}
                        alt="Aadhar Back"
                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-80"
                        onClick={() => window.open(kycImages.back, "_blank")}
                      />
                    ) : (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                        Not available
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Only for pending */}
            {selectedApp.status === "pending" && (
              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? "Processing..." : "Approve"}
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting {selectedApp?.fullName}'s application.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md font-medium hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || rejectReason.trim().length < 5}
                className="flex-1 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectorApplicationsView;
