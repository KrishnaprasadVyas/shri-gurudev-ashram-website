/**
 * Collector API Service
 * Handles all API calls for collector KYC application and dashboard
 */

import { API_BASE_URL, getAuthToken, parseJsonResponse } from '../utils/api';

/**
 * Create headers with auth token (for JSON requests)
 */
const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Create headers with auth token only (for FormData requests)
 */
const getAuthHeadersMultipart = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
});

/**
 * Get collector application status
 * @returns {Promise<{success: boolean, data: {role: string, collectorProfile: object}}>}
 */
export const getCollectorStatus = async () => {
  const response = await fetch(`${API_BASE_URL}/collector/status`, {
    headers: getAuthHeaders(),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to get collector status");
  }

  return data;
};

/**
 * Apply for collector role
 * @param {FormData} formData - Form data with fullName, address, panNumber, aadharFront, aadharBack
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const applyForCollector = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/collector/apply`, {
    method: "POST",
    headers: getAuthHeadersMultipart(),
    body: formData,
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to submit application");
  }

  return data;
};

/**
 * Reapply for collector role after rejection
 * @param {FormData} formData - Form data with fullName, address, panNumber, aadharFront, aadharBack
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const reapplyForCollector = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/collector/reapply`, {
    method: "POST",
    headers: getAuthHeadersMultipart(),
    body: formData,
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to resubmit application");
  }

  return data;
};

/**
 * Get collector dashboard data (approved collectors only)
 * @returns {Promise<{success: boolean, data: object}>}
 */
export const getCollectorDashboard = async () => {
  const response = await fetch(`${API_BASE_URL}/collector/dashboard`, {
    headers: getAuthHeaders(),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch dashboard");
  }

  return data;
};

/**
 * Validate referral code (public endpoint)
 * @param {string} code - Referral code to validate
 * @returns {Promise<{valid: boolean, collectorId?: string, collectorName?: string, error?: string}>}
 */
export const validateReferralCode = async (code) => {
  const response = await fetch(`${API_BASE_URL}/referral/validate/${encodeURIComponent(code)}`);
  const data = await parseJsonResponse(response);
  return data;
};

/**
 * Get public leaderboard
 * @returns {Promise<{success: boolean, data: Array}>}
 */
export const getLeaderboard = async () => {
  const response = await fetch(`${API_BASE_URL}/leaderboard/top`);
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch leaderboard");
  }

  return data;
};

export default {
  getCollectorStatus,
  applyForCollector,
  reapplyForCollector,
  getCollectorDashboard,
  validateReferralCode,
  getLeaderboard,
};
