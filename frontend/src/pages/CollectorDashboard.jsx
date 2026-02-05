import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";
import { formatCurrency } from "../utils/helpers";
import SectionHeading from "../components/SectionHeading";
import ReferralLinkGenerator from "../components/ReferralLinkGenerator";

/**
 * CollectorDashboard - Dashboard for collectors to view stats and share referral links
 * 
 * Every logged-in user is automatically a collector.
 * No commission or incentive system - purely for donation attribution.
 * 
 * Sections:
 * 1. Welcome Section (name, referral code)
 * 2. Stats Cards (total collected, donation count)
 * 3. Leaderboard (top 5 collectors)
 * 4. Referral Link Generator
 */
const CollectorDashboard = () => {
  const { user, token, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Collector stats state
  const [stats, setStats] = useState({
    totalAmount: 0,
    donationCount: 0,
    referralCode: null,
    collectorName: null,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);

  /**
   * Fetch collector stats from backend
   */
  const fetchStats = useCallback(async () => {
    if (!token) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    setStatsError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/donations/my-collector-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setStatsError("Session expired. Please login again.");
        setStatsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch collector stats");
      }

      const data = await parseJsonResponse(response);
      setStats({
        totalAmount: data.totalAmount || 0,
        donationCount: data.donationCount || 0,
        referralCode: data.referralCode || null,
        collectorName: data.collectorName || user?.fullName || "Collector",
      });
    } catch (err) {
      console.error("Error fetching collector stats:", err);
      setStatsError("Unable to load your stats. Please try again.");
    } finally {
      setStatsLoading(false);
    }
  }, [token, user?.fullName]);

  /**
   * Fetch leaderboard from backend
   */
  const fetchLeaderboard = useCallback(async () => {
    setLeaderboardLoading(true);
    setLeaderboardError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/donations/leaderboard?limit=5`);

      if (!response.ok) {
        throw new Error("Failed to fetch leaderboard");
      }

      const data = await parseJsonResponse(response);
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setLeaderboardError("Unable to load leaderboard. Please try again.");
    } finally {
      setLeaderboardLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchLeaderboard();
    }
  }, [isAuthenticated, fetchStats, fetchLeaderboard]);

  // Show loading state while auth is checking
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-amber-50 to-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        <SectionHeading
          title="Collector Dashboard"
          subtitle="Thank you for supporting our mission"
          center={true}
        />

        {/* Welcome Section */}
        <WelcomeSection
          collectorName={stats.collectorName || user?.fullName}
          referralCode={stats.referralCode}
          isLoading={statsLoading}
        />

        {/* Stats Cards */}
        <div className="mt-8">
          <StatsCards
            totalAmount={stats.totalAmount}
            donationCount={stats.donationCount}
            isLoading={statsLoading}
            error={statsError}
            onRetry={fetchStats}
          />
        </div>

        {/* Leaderboard */}
        <div className="mt-8">
          <LeaderboardSection
            leaderboard={leaderboard}
            isLoading={leaderboardLoading}
            error={leaderboardError}
            onRetry={fetchLeaderboard}
          />
        </div>

        {/* Referral Link Generator */}
        <div className="mt-8">
          <ReferralLinkGenerator
            referralCode={stats.referralCode}
            collectorName={stats.collectorName}
          />
        </div>

        {/* Quick Links */}
        <div className="mt-8 text-center">
          <Link
            to="/my-donations"
            className="text-amber-700 hover:text-amber-800 font-medium underline"
          >
            View Your Personal Donations →
          </Link>
        </div>
      </div>
    </section>
  );
};

/**
 * WelcomeSection - Displays collector name and referral code
 */
const WelcomeSection = ({ collectorName, referralCode, isLoading }) => {
  const [copied, setCopied] = useState(false);

  const copyReferralCode = async () => {
    if (!referralCode) return;
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6 text-center">
      {isLoading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mx-auto"></div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">🙏</span>
            <h2 className="text-2xl font-bold text-amber-900">
              Jai Gurudev, {collectorName || "Collector"}!
            </h2>
          </div>

          {referralCode ? (
            <div className="mt-4">
              <p className="text-gray-600 text-sm mb-2">Your Referral Code</p>
              <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <span className="text-xl font-bold text-amber-900 font-mono tracking-wider">
                  {referralCode}
                </span>
                <button
                  onClick={copyReferralCode}
                  className="p-1 hover:bg-amber-100 rounded transition-colors"
                  title="Copy referral code"
                >
                  {copied ? (
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-3">
                Share your referral link to help collect donations for the Ashram.
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-2">
              Your referral code is being generated...
            </p>
          )}
        </>
      )}
    </div>
  );
};

/**
 * StatsCards - Displays collector statistics
 */
const StatsCards = ({ totalAmount, donationCount, isLoading, error, onRetry }) => {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-700 mb-3">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Total Amount Collected */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="h-10 bg-gray-200 rounded w-40"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Total Collected</span>
            </div>
            <p className="text-3xl font-bold text-amber-900">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Donations attributed to your referrals
            </p>
          </>
        )}
      </div>

      {/* Donation Count */}
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="h-10 bg-gray-200 rounded w-20"></div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-sm font-medium">Donations Collected</span>
            </div>
            <p className="text-3xl font-bold text-amber-900">
              {donationCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Number of successful donations
            </p>
          </>
        )}
      </div>
    </div>
  );
};

/**
 * LeaderboardSection - Displays top 5 collectors
 * Privacy-conscious: Shows only names and amounts, no codes or counts
 */
const LeaderboardSection = ({ leaderboard, isLoading, error, onRetry }) => {
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
        <h3 className="text-lg font-bold text-amber-900 mb-4">Top Collectors</h3>
        <div className="text-center py-4">
          <p className="text-red-600 mb-3">{error}</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-amber-900">Top Collectors</h3>
        <span className="text-xs text-gray-500">Top 5</span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 h-4 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🌱</div>
          <p className="text-gray-600">
            Be the first to collect donations!
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Share your referral link to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {leaderboard.map((collector, index) => (
              <div
                key={collector.collectorId || index}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                {/* Rank Badge */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-amber-400 text-amber-900" :
                  index === 1 ? "bg-gray-300 text-gray-700" :
                  index === 2 ? "bg-amber-200 text-amber-800" :
                  "bg-gray-200 text-gray-600"
                }`}>
                  {collector.rank || index + 1}
                </div>

                {/* Collector Name */}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {collector.collectorName || "Anonymous Collector"}
                  </p>
                </div>

                {/* Total Amount */}
                <div className="text-right">
                  <p className="font-bold text-amber-700">
                    {formatCurrency(collector.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Soft message for users not in top 5 */}
          <p className="text-center text-gray-500 text-xs mt-4">
            Top 5 collectors are shown here. Keep sharing to climb the ranks!
          </p>
        </>
      )}
    </div>
  );
};

export default CollectorDashboard;
