import { API_BASE_URL, getAuthToken, parseJsonResponse } from "../utils/api";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${getAuthToken()}`,
  "Content-Type": "application/json",
});

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(data.message || "Finance API request failed");
  }
  return data;
};

export const financeApi = {
  // Cash Advances (Type A) & Direct Payments (Type B)
  createAdvance: (data) =>
    apiRequest("/finance/advances", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createDirectPayment: (data) =>
    apiRequest("/finance/advances/direct", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listAdvances: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/advances${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getAdvanceById: (id) =>
    apiRequest(`/finance/advances/${id}`, {
      method: "GET",
    }),

  settleAdvance: (id, data) =>
    apiRequest(`/finance/advances/${id}/settle`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  cancelAdvance: (id, reason) =>
    apiRequest(`/finance/advances/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  // Vouchers
  listVouchers: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/vouchers${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getVoucherById: (id) =>
    apiRequest(`/finance/vouchers/${id}`, {
      method: "GET",
    }),

  downloadVoucherPdf: async (id, voucherNumber) => {
    const url = `${API_BASE_URL}/finance/vouchers/${id}/pdf`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download voucher PDF");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Voucher_${voucherNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Donations (Trustee offline entry & management)
  listDonations: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/admin/system/donations${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  createOfflineDonation: (data) =>
    apiRequest("/admin/system/donations/offline", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getPublicDonationHeads: () =>
    apiRequest("/public/donation-heads", {
      method: "GET",
    }),

  downloadDonationReceipt: async (id, receiptNumber) => {
    const url = `${API_BASE_URL}/donations/${id}/receipt`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download donation receipt PDF");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `Receipt_${receiptNumber || id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // Finance Reports (Phase 5)
  getDashboardStats: () =>
    apiRequest("/finance/reports/dashboard-stats", { method: "GET" }),

  getCashBook: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/reports/cash-book${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getVoucherRegisterReport: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/reports/voucher-register${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getOutstandingAdvancesReport: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/reports/outstanding-advances${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getMonthlySummaryReport: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/reports/monthly-summary${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  getAnnualExportReport: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return apiRequest(`/finance/reports/annual-export${query ? `?${query}` : ""}`, {
      method: "GET",
    });
  },

  downloadReportCsv: async (reportType, params = {}, filename) => {
    const query = new URLSearchParams({
      ...Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
      ),
      export: "csv",
    }).toString();
    const url = `${API_BASE_URL}/finance/reports/${reportType}?${query}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to download report CSV");
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || `${reportType}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },
};
