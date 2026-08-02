import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { API_BASE_URL, parseJsonResponse } from "../utils/api";

const AuthContext = createContext(null);

/**
 * Decode JWT token payload without external library
 */
const decodeToken = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 < Date.now();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  /**
   * Fetch current user info from backend
   */
  const fetchUser = useCallback(async (authToken) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      const userData = await parseJsonResponse(response);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Error fetching user:", error);
      // Clear invalid token
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return null;
    }
  }, []);

  /**
   * Login with token - store token and fetch user data
   */
  const login = useCallback(
    async (newToken) => {
      if (!newToken || isTokenExpired(newToken)) {
        return null;
      }

      localStorage.setItem("token", newToken);
      setToken(newToken);

      const userData = await fetchUser(newToken);
      return userData;
    },
    [fetchUser]
  );

  /**
   * Logout - clear all auth state
   */
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  /**
   * Check and validate existing auth on mount
   */
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem("token");

    if (!storedToken || isTokenExpired(storedToken)) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      setIsLoading(false);
      return false;
    }

    setToken(storedToken);
    const userData = await fetchUser(storedToken);
    setIsLoading(false);
    return !!userData;
  }, [fetchUser]);

  /**
   * Check auth on initial mount
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Routes that require only authentication (no privileged role).
   * A USER who was deep-linking to one of these will be sent back there
   * after login. Paths that require a privileged role must NOT appear here
   * to prevent any accidental privilege escalation via returnUrl.
   */
  const USER_ACCESSIBLE_ROUTES = [
    "/my-donations",
    "/collector/apply",
    "/collector/reapply",
  ];

  const getRedirectPath = useCallback((returnUrlOrRole, fallbackUser = null) => {
    // Resolve the target role from whatever argument is provided
    let targetRole = null;
    if (typeof returnUrlOrRole === "string" && !returnUrlOrRole.startsWith("/")) {
      // Argument is a role string (not a path)
      targetRole = returnUrlOrRole;
    } else if (returnUrlOrRole && typeof returnUrlOrRole === "object" && returnUrlOrRole.role) {
      // Argument is a user object
      targetRole = returnUrlOrRole.role;
    } else if (fallbackUser && fallbackUser.role) {
      // Fallback user provided
      targetRole = fallbackUser.role;
    } else {
      // Use current context user role
      targetRole = user?.role;
    }

    // Privileged roles always go to their hardcoded dashboards, regardless of
    // any returnUrl. This prevents returnUrl from being used as an escalation
    // vector and ensures a consistent entry point for admin/collector/trustee.
    switch (targetRole) {
      case "SYSTEM_ADMIN":
        return "/admin/system";
      case "WEBSITE_ADMIN":
        return "/admin/website";
      case "NITYA_ANNADAN_ADMIN":
        return "/admin/nitya-annadan";
      case "TRUSTEE": // ERP Phase 1
        return "/admin/trustee";
      case "COLLECTOR_APPROVED":
        return "/collector";
      default: {
        // USER role: honour returnUrl only if it is a whitelisted user-accessible
        // route (one that requires authentication but no privileged role).
        // Any other path — including admin/collector/trustee URLs — is ignored
        // and the user is sent to the public Home page instead.
        const returnUrl =
          typeof returnUrlOrRole === "string" && returnUrlOrRole.startsWith("/")
            ? returnUrlOrRole
            : null;
        if (returnUrl && USER_ACCESSIBLE_ROUTES.some((r) => returnUrl.startsWith(r))) {
          return returnUrl;
        }
        return "/";
      }
    }
  }, [user?.role]);

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth,
    getRedirectPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
