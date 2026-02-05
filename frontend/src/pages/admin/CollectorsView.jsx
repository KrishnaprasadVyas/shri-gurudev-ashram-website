import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../utils/api";

/**
 * CollectorsView - Admin-only view of all collectors with stats
 * 
 * Features:
 * - Full leaderboard (not just top 5)
 * - Pagination
 * - Click to view collector details
 * - No donor information shown
 */
const CollectorsView = () => {
  const navigate = useNavigate();
  const [collectors, setCollectors] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch collectors list
   */
  const fetchCollectors = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collectors?page=${page}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch collectors");
      }

      const data = await parseJsonResponse(response);
      setCollectors(data.collectors || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      console.error("Error fetching collectors:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch collector summary stats
   */
  const fetchSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/admin/system/collectors/summary`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await parseJsonResponse(response);
        setSummary(data);
      }
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  }, []);

  useEffect(() => {
    fetchCollectors(1);
    fetchSummary();
  }, [fetchCollectors, fetchSummary]);

  const handlePageChange = (newPage) => {
    fetchCollectors(newPage);
  };

  const handleCollectorClick = (collectorId) => {
    navigate(`/admin/system/collectors/${collectorId}`);
  };

  if (loading && collectors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
        <span className="ml-3 text-gray-600">Loading collectors...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => fetchCollectors(1)}
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collector Management</h1>
        <p className="text-gray-600 text-sm mt-1">
          View and manage collectors who have attributed donations
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Active Collectors"
            value={summary.activeCollectors}
            subtitle="Users with attributed donations"
            icon="users"
          />
          <SummaryCard
            title="Donations with Referral"
            value={summary.withReferral.count}
            subtitle={formatCurrency(summary.withReferral.amount)}
            icon="link"
          />
          <SummaryCard
            title="Donations without Referral"
            value={summary.withoutReferral.count}
            subtitle={formatCurrency(summary.withoutReferral.amount)}
            icon="user"
          />
        </div>
      )}

      {/* Collectors Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">All Collectors</h2>
          <p className="text-sm text-gray-500">
            Ranked by total amount collected
          </p>
        </div>

        {collectors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-600">No collectors found</p>
            <p className="text-gray-500 text-sm mt-1">
              Collectors appear here once donations are attributed to them
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Collector
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Donations
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Collected
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {collectors.map((collector) => (
                    <tr
                      key={collector.collectorId}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCollectorClick(collector.collectorId)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RankBadge rank={collector.rank} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {collector.collectorName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge disabled={collector.collectorDisabled} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {collector.donationCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-amber-700">
                          {formatCurrency(collector.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollectorClick(collector.collectorId);
                          }}
                          className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        >
                          View Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} collectors
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

/**
 * Summary Card Component
 */
const SummaryCard = ({ title, value, subtitle, icon }) => {
  const icons = {
    users: (
      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    link: (
      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    user: (
      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-2">
        {icons[icon]}
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
};

/**
 * Rank Badge Component
 */
const RankBadge = ({ rank }) => {
  const colors =
    rank === 1
      ? "bg-amber-400 text-amber-900"
      : rank === 2
      ? "bg-gray-300 text-gray-700"
      : rank === 3
      ? "bg-amber-200 text-amber-800"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${colors}`}>
      {rank}
    </span>
  );
};

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

export default CollectorsView;
