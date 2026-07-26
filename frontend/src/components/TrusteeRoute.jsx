import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * TrusteeRoute — ERP Phase 1
 *
 * Route guard that allows TRUSTEE and SYSTEM_ADMIN.
 * All other roles are rejected with appropriate redirects.
 *
 * Usage:
 *   <TrusteeRoute>
 *     <SomeFinancialPage />
 *   </TrusteeRoute>
 *
 * Why a separate component instead of using AdminRoute?
 * AdminRoute handles CMS/system routes. TrusteeRoute is purpose-built for
 * financial ERP routes under /admin/trustee/* with its own redirect logic.
 * Keeping them separate avoids making AdminRoute's logic increasingly complex.
 */
const TrusteeRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while verifying auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Not logged in at all → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const userRole = user?.role;

  // TRUSTEE and SYSTEM_ADMIN are allowed
  if (userRole === "TRUSTEE" || userRole === "SYSTEM_ADMIN") {
    return children;
  }

  // Any other authenticated role → redirect to admin home
  // They may be a WEBSITE_ADMIN or NITYA_ANNADAN_ADMIN who typed the URL directly
  return (
    <Navigate
      to="/admin"
      state={{
        error: "You do not have permission to access the Finance Portal.",
      }}
      replace
    />
  );
};

export default TrusteeRoute;
