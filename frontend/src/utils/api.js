/**
 * Centralized API Configuration
 * 
 * All API calls should use this utility to ensure:
 * 1. Correct base URL (relative /api path)
 * 2. Consistent error handling
 * 3. Proper JSON parsing with HTML response detection
 * 
 * IMPORTANT: Uses relative paths only (/api/...) to work correctly
 * behind Nginx reverse proxy in production.
 */

// Always use relative path - works with Nginx proxy
export const API_BASE_URL = '/api';

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => localStorage.getItem('token');

/**
 * Create headers with optional auth token
 */
export const getAuthHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

/**
 * Check if response is HTML instead of JSON
 * This happens when Nginx serves index.html for 404s
 */
const isHtmlResponse = (text) => {
  return text.trim().startsWith('<!') || text.trim().startsWith('<html');
};

/**
 * Parse JSON response with proper error handling
 * Detects when HTML is returned instead of JSON (common proxy misconfiguration issue)
 */
export const parseJsonResponse = async (response) => {
  const text = await response.text();
  
  // Check if we got HTML instead of JSON
  if (isHtmlResponse(text)) {
    throw new Error('API returned HTML instead of JSON. The endpoint may not exist or the server is misconfigured.');
  }
  
  // Try to parse as JSON
  try {
    return JSON.parse(text);
  } catch {
    // If parsing fails and response wasn't ok, throw generic error
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    // If response was ok but not JSON, return the text
    return { data: text };
  }
};

/**
 * Generic API request handler with proper error handling
 * 
 * @param {string} endpoint - API endpoint (e.g., '/auth/me')
 * @param {object} options - Fetch options
 * @param {boolean} options.includeAuth - Include auth token (default: true)
 * @returns {Promise<object>} - Parsed JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  const { includeAuth = true, ...fetchOptions } = options;
  
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getAuthHeaders(includeAuth),
      ...fetchOptions.headers,
    },
  });
  
  const data = await parseJsonResponse(response);
  
  if (!response.ok) {
    const errorMessage = data.message || data.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }
  
  return data;
};

/**
 * Make a GET request
 */
export const apiGet = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'GET' });
};

/**
 * Make a POST request
 */
export const apiPost = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * Make a PUT request
 */
export const apiPut = (endpoint, body, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * Make a PATCH request
 */
export const apiPatch = (endpoint, body = {}, options = {}) => {
  return apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

/**
 * Make a DELETE request
 */
export const apiDelete = (endpoint, options = {}) => {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
};

export default {
  API_BASE_URL,
  getAuthToken,
  getAuthHeaders,
  apiRequest,
  apiGet,
  apiPost,
  apiPut,
  apiPatch,
  apiDelete,
};
