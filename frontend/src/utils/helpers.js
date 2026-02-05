// Utility helper functions

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString, timeString) => {
  return `${formatDate(dateString)} at ${timeString}`;
};

export const generateOrderId = () => {
  return `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;
};

export const generateTransactionId = () => {
  return `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[6-9]\d{9}$/;
  return re.test(phone);
};

export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Safely mask PAN or Aadhaar numbers for display
 * @param {string} idNumber - The ID number to mask
 * @param {string} idType - "PAN" or "Aadhaar"
 * @returns {string} Masked ID
 *
 * Examples:
 * - Aadhaar: "123456789012" → "**** **** 9012"
 * - PAN: "ABCDE1234F" → "******234F"
 */
export const maskGovtId = (idNumber, idType) => {
  try {
    if (!idNumber || typeof idNumber !== 'string') return '****';

    const id = idNumber.trim();
    if (id.length <= 4) return '****';

    const normalizedType = idType?.toUpperCase();

    if (normalizedType === 'AADHAAR') {
      // Aadhaar: Show last 4 digits with format "**** **** 1234"
      const last4 = id.slice(-4);
      return `**** **** ${last4}`;
    }

    if (normalizedType === 'PAN') {
      // PAN: Show last 4 characters with format "******1234"
      const last4 = id.slice(-4);
      return `******${last4}`;
    }

    // Default fallback: mask all but last 4
    return '****' + id.slice(-4);
  } catch (error) {
    console.error('maskGovtId error:', error);
    return '****';
  }
};

