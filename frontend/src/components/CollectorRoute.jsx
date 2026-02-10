import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * CollectorRoute - Wraps routes that require COLLECTOR_APPROVED role
 * Redirects to home if user is not an approved collector
 */
const CollectorRoute = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-amber-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-200 border-t-amber-600"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Redirect to home if not an approved collector
  if (user?.role !== "COLLECTOR_APPROVED") {
    return <Navigate to="/" replace />;
  }

  // Render protected content
  return children;
};

export default CollectorRoute;
