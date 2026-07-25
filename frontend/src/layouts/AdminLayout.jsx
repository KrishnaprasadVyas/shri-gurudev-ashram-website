import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [showTooltip, setShowTooltip] = useState(false);
  const isAdminHome = location.pathname === "/admin";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-amber-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <img
                  src="/assets/Logo.png"
                  alt="Logo"
                  className="h-10 w-auto"
                />
                <span className="font-semibold text-lg hidden sm:inline">
                  Admin Panel
                </span>
              </Link>
              {user?.role && (
                <span className="hidden md:inline-block px-2 py-1 bg-amber-600 rounded text-xs font-medium">
                  {user.role === "SYSTEM_ADMIN"
                    ? "System Admin"
                    : user.role === "NITYA_ANNADAN_ADMIN"
                    ? "Nitya Annadan Admin"
                    : "Website Admin"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-amber-100">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">
                  {user?.fullName || user?.mobile || "Admin"}
                </span>
              </div>
              <Link
                to="/"
                className="px-3 py-1.5 text-sm bg-amber-600 hover:bg-amber-500 rounded-md transition-colors"
              >
                View Site
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-500 rounded-md transition-colors flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Context Switch Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 mr-4">
                Context:
              </span>
              <button
                className="px-4 py-2 bg-amber-600 text-white rounded-md font-medium text-sm cursor-default"
                disabled
              >
                Donation
              </button>
              <div className="relative">
                <button
                  className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md font-medium text-sm cursor-not-allowed opacity-60"
                  disabled
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  Shop (Coming Soon)
                </button>
                {showTooltip && (
                  <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap z-10">
                    Shop module is not active yet
                  </div>
                )}
              </div>
            </div>
            {!isAdminHome && (
              <button
                onClick={() => navigate("/admin")}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium"
              >
                ← Back to Admin Home
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Admin Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
