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
   * Get redirect path based on user role
   */
  const getRedirectPath = useCallback((role) => {
    switch (role) {
      case "SYSTEM_ADMIN":
        return "/admin/system";
      case "WEBSITE_ADMIN":
        return "/admin/website";
      default:
        return "/";
    }
  }, []);

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
