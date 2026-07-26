import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * AdminRoute - Wraps routes that require admin privileges
 * 
 * Role-based access:
 * - SYSTEM_ADMIN: Can access all admin routes (/admin/*)
 * - WEBSITE_ADMIN: Can access /admin/website/* only
 * - USER: No admin access
 */
const AdminRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const userRole = user?.role;
  const isSystemAdmin = userRole === "SYSTEM_ADMIN";
  const isWebsiteAdmin = userRole === "WEBSITE_ADMIN";
  const isNityaAnnadanAdmin = userRole === "NITYA_ANNADAN_ADMIN";
  const isTrustee = userRole === "TRUSTEE"; // ERP Phase 1
  const isAdmin =
    isSystemAdmin || isWebsiteAdmin || isNityaAnnadanAdmin || isTrustee;

  // Check if user has any admin role
  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        state={{ error: "You don't have permission to access this page." }}
        replace
      />
    );
  }

  // Check specific role requirements
  if (requiredRole) {
    if (requiredRole === "SYSTEM_ADMIN" && !isSystemAdmin) {
      return (
        <Navigate
          to="/admin"
          state={{ error: "You don't have permission to access System Admin." }}
          replace
        />
      );
    }
  }

  // Path-based access control
  const path = location.pathname;

  // WEBSITE_ADMIN cannot access system or trustee routes
  if (isWebsiteAdmin && !isSystemAdmin) {
    if (path.startsWith("/admin/system") || path.startsWith("/admin/trustee")) {
      return (
        <Navigate
          to="/admin/website"
          state={{ error: "You don't have permission to access this area." }}
          replace
        />
      );
    }
  }

  // TRUSTEE cannot access system admin routes
  if (isTrustee && !isSystemAdmin) {
    if (path.startsWith("/admin/system") || path.startsWith("/admin/website")) {
      return (
        <Navigate
          to="/admin/trustee"
          state={{ error: "You don't have permission to access this area." }}
          replace
        />
      );
    }
  }

  // NITYA_ANNADAN_ADMIN can only access nitya-annadan routes (+ admin home)
  if (isNityaAnnadanAdmin && !isSystemAdmin) {
    if (
      path.startsWith("/admin/system") ||
      path.startsWith("/admin/website") ||
      path.startsWith("/admin/trustee")
    ) {
      return (
        <Navigate
          to="/admin/nitya-annadan"
          state={{ error: "You don't have permission to access this area." }}
          replace
        />
      );
    }
  }

  // Render admin content
  return children;
};

export default AdminRoute;
