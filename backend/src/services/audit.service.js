/**
 * Audit Service
 * Structured logging for security-sensitive operations
 * Production-ready: Can be connected to external logging service (ELK, CloudWatch, etc.)
 */

const LOG_LEVELS = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  AUDIT: "AUDIT",
};

/**
 * Log an audit event (security-sensitive action)
 * @param {string} action - The action being performed
 * @param {Object} details - Action-specific details
 */
const logAudit = (action, details = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: LOG_LEVELS.AUDIT,
    action,
    ...details,
  };

  // In production, replace with structured logging to external service
  console.log(`[AUDIT] ${JSON.stringify(logEntry)}`);
};

/**
 * Log collector application event
 */
const logCollectorApplication = (userId, fullName, ip) => {
  logAudit("COLLECTOR_APPLICATION", {
    userId,
    fullName,
    ip,
    message: "User submitted collector application",
  });
};

/**
 * Log collector approval event
 */
const logCollectorApproval = (collectorId, collectorName, approvedBy) => {
  logAudit("COLLECTOR_APPROVED", {
    collectorId,
    collectorName,
    approvedBy,
    message: "Collector application approved",
  });
};

/**
 * Log collector rejection event
 */
const logCollectorRejection = (collectorId, collectorName, rejectedBy, reason) => {
  logAudit("COLLECTOR_REJECTED", {
    collectorId,
    collectorName,
    rejectedBy,
    reason,
    message: "Collector application rejected",
  });
};

/**
 * Log referral code validation (for abuse detection)
 */
const logReferralValidation = (code, valid, ip) => {
  logAudit("REFERRAL_VALIDATION", {
    code: code ? code.substring(0, 4) + "***" : "N/A", // Partial code for privacy
    valid,
    ip,
  });
};

/**
 * Log donation with collector attribution
 */
const logDonationAttribution = (donationId, collectorId, collectorName, amount) => {
  logAudit("DONATION_ATTRIBUTED", {
    donationId,
    collectorId,
    collectorName,
    amount,
    message: "Donation attributed to collector",
  });
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (type, details = {}) => {
  logAudit("SUSPICIOUS_ACTIVITY", {
    type,
    ...details,
    severity: "HIGH",
  });
};

module.exports = {
  logAudit,
  logCollectorApplication,
  logCollectorApproval,
  logCollectorRejection,
  logReferralValidation,
  logDonationAttribution,
  logSuspiciousActivity,
  LOG_LEVELS,
};
