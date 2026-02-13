import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getLeaderboard } from "../services/collectorApi";
import { formatCurrency } from "../utils/helpers";
import SectionHeading from "../components/SectionHeading";

/**
 * LeaderboardPage - Public page showing top 5 collectors
 *
 * Features:
 * - Fetches from GET /api/leaderboard/top
 * - Shows rank, collector name, total amount
 * - No PII exposed (only name and amount)
 * - Encourages visitors to become collectors
 */
const LeaderboardPage = () => {
  const { t } = useTranslation();
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getLeaderboard();
      setLeaderboard(data.data || []);
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Unable to load leaderboard. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-amber-50 to-white min-h-screen">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          title={t("leaderboard.title")}
          subtitle={t("leaderboard.subtitle")}
          center={true}
        />

        {/* Trophy Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 mb-8 text-center text-white">
          <div className="text-5xl mb-3">🏆</div>
          <h2 className="text-2xl font-bold mb-2">
            {t("leaderboard.heading")}
          </h2>
          <p className="text-amber-100">{t("leaderboard.description")}</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
            <p className="text-red-700 mb-3">{error}</p>
            <button
              onClick={fetchLeaderboard}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
            >
              {t("leaderboard.tryAgain")}
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-28"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && leaderboard.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-12 text-center">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">
              {t("leaderboard.noCollectors")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("leaderboard.noCollectorsNote")}
            </p>
            <Link
              to="/collector/apply"
              className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              {t("leaderboard.becomeCollector")}
            </Link>
          </div>
        )}

        {/* Leaderboard List */}
        {!isLoading && !error && leaderboard.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {leaderboard.map((collector, index) => (
                <div
                  key={collector.collectorId || index}
                  className={`flex items-center gap-4 p-5 ${
                    index === 0 ? "bg-amber-50" : ""
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0
                        ? "bg-amber-400 text-amber-900 shadow-lg"
                        : index === 1
                          ? "bg-gray-300 text-gray-700"
                          : index === 2
                            ? "bg-amber-200 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : collector.rank || index + 1}
                  </div>

                  {/* Collector Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold truncate ${
                        index === 0 ? "text-amber-900 text-lg" : "text-gray-900"
                      }`}
                    >
                      {collector.collectorName ||
                        t("leaderboard.anonymousCollector")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("leaderboard.donationsCollected", {
                        count: collector.donationCount,
                      })}
                    </p>
                  </div>

                  {/* Total Amount */}
                  <div className="text-right">
                    <p
                      className={`font-bold ${
                        index === 0
                          ? "text-amber-700 text-xl"
                          : "text-amber-600 text-lg"
                      }`}
                    >
                      {formatCurrency(collector.totalAmount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-200">
            <div className="text-4xl mb-4">🙏</div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              {t("leaderboard.wantOnLeaderboard")}
            </h3>
            <p className="text-green-700 mb-6">{t("leaderboard.spreadWord")}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/collector/apply"
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                {t("leaderboard.becomeCollector")}
              </Link>
              <Link
                to="/donate"
                className="px-6 py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
              >
                {t("leaderboard.makeDonation")}
              </Link>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <p className="text-center text-gray-500 text-sm mt-8">
          {t("leaderboard.infoNote")}
        </p>
      </div>
    </section>
  );
};

export default LeaderboardPage;
