import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { API_BASE_URL } from "../utils/api";

/**
 * CollectorPublicProfile — Public page shown when someone visits a referral link
 *
 * Route: /collector/profile/:code (no authentication required)
 *
 * Data from: GET /api/referral/validate/:code
 * Returns: { valid, collectorId, collectorName }
 *
 * Documented Limitations:
 *   - Only name and referral code can be displayed publicly (endpoint returns
 *     collectorName and the MongoDB _id — no mobile, email, joining date, or photo)
 *   - collectorId is a MongoDB ObjectId — not displayed; referral code is used as the
 *     public identifier
 *   - Photo and sequential ID are unavailable without backend changes
 */
const CollectorPublicProfile = () => {
  const { code } = useParams();
  const [state, setState] = useState({ status: "loading", name: null });

  useEffect(() => {
    if (!code) {
      setState({ status: "invalid" });
      return;
    }

    fetch(`${API_BASE_URL}/referral/validate/${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setState({ status: "found", name: data.collectorName });
        } else {
          setState({ status: "invalid" });
        }
      })
      .catch(() => setState({ status: "error" }));
  }, [code]);

  return (
    <section className="min-h-screen bg-gradient-to-b from-amber-50 to-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm text-center">
        {state.status === "loading" && (
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-amber-200 border-t-amber-600" />
        )}

        {state.status === "found" && (
          <div className="bg-white rounded-2xl shadow-md border border-amber-100 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-br from-amber-600 to-amber-800 px-6 py-8 text-white">
              <p className="text-amber-200 text-xs font-semibold uppercase tracking-widest mb-4">
                Shri Gurudev Ashram
              </p>
              {/* Avatar initial */}
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">
                {(state.name || "C").charAt(0).toUpperCase()}
              </div>
              <h1 className="text-2xl font-bold">{state.name || "Collector"}</h1>
              <div className="mt-2 inline-flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Verified Collector
              </div>
            </div>

            {/* Card Body */}
            <div className="px-6 py-6">
              <p className="text-xs text-gray-500 mb-1">Referral Code</p>
              <p className="text-2xl font-bold font-mono text-amber-900 tracking-widest">{code}</p>
              <p className="text-gray-500 text-sm mt-4">
                This collector is an authorised fundraiser for Shri Gurudev Ashram. Donations made
                using this referral code will be attributed to them.
              </p>

              <Link
                to={`/?ref=${code}`}
                className="mt-6 inline-block w-full px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                🙏 Donate Now
              </Link>
              <Link
                to="/"
                className="mt-3 inline-block text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Visit Shri Gurudev Ashram
              </Link>
            </div>
          </div>
        )}

        {state.status === "invalid" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-500 text-sm">
              This referral code is invalid or inactive. Please check the link and try again.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Go Home
            </Link>
          </div>
        )}

        {state.status === "error" && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-500 text-sm">Unable to load this profile. Please try again.</p>
            <button
              onClick={() => setState({ status: "loading" })}
              className="mt-6 px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CollectorPublicProfile;
