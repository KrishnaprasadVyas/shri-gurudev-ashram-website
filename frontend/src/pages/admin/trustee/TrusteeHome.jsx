/**
 * TrusteeHome — ERP Phase 1 (Placeholder)
 *
 * This is the landing page of the Finance Portal.
 * In Phase 1, it is a structural placeholder confirming the role and portal
 * are correctly wired up.
 *
 * It will be replaced with a real financial dashboard in Phase 5,
 * which will show:
 *   - Outstanding Cash Advances
 *   - Today's Donations
 *   - This Month's Vouchers
 *   - Monthly Income vs Expense comparison
 *   - Quick action buttons
 */
const TrusteeHome = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Finance Portal
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Shri Gurudev Ashram — Ashram ERP
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wide">
            Phase 1 Active
          </span>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          System Status
        </h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Finance Portal — Infrastructure ready
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              TRUSTEE role — Active and correctly configured
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              AuditLog model — Ready to record financial operations
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Counter service — Sequential number generator ready
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Cash Advances — Coming in Phase 3
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Vouchers — Coming in Phase 3
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Offline Donations &amp; Receipts — Coming in Phase 4
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
            <span className="text-sm text-gray-700">
              Financial Reports &amp; Dashboard — Coming in Phase 5
            </span>
          </div>
        </div>
      </div>

      {/* Role Information */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-5">
        <h3 className="text-sm font-semibold text-emerald-900 mb-2">
          Finance Portal Access
        </h3>
        <p className="text-sm text-emerald-800 leading-relaxed">
          You are logged in with Finance Portal access. This portal manages
          ashram financial operations including cash advances, expense
          settlements, voucher generation, and financial reports. Features will
          be activated progressively across phases.
        </p>
      </div>
    </div>
  );
};

export default TrusteeHome;
