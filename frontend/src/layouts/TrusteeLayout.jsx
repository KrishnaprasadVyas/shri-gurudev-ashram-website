import { Outlet, useNavigate, useLocation } from "react-router-dom";

/**
 * TrusteeLayout — ERP Phase 1
 *
 * Shell layout for the Finance (Trustee) Portal.
 * Follows the exact same structural pattern as NityaAnnadanAdminLayout
 * to maintain consistency across the admin panel.
 *
 * Navigation items are progressively populated as ERP phases are completed:
 * - Phase 1: Overview (placeholder)
 * - Phase 3: Advances, Vouchers
 * - Phase 4: Donations
 * - Phase 5: Reports
 * - Phase 6: Audit Log
 */
const TrusteeLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigation items.
   * `comingSoon: true` items are visible but non-clickable.
   * They will be activated in future phases.
   */
  const navItems = [
    {
      path: "/admin/trustee/overview",
      label: "Overview",
      comingSoon: false,
    },
    {
      path: "/admin/trustee/advances",
      label: "Cash Advances",
      comingSoon: false, // Phase 3
    },
    {
      path: "/admin/trustee/vouchers",
      label: "Vouchers",
      comingSoon: false, // Phase 3
      indent: true,
    },
    {
      path: "/admin/trustee/donations",
      label: "Donations",
      comingSoon: false, // Phase 4
    },
    {
      path: "/admin/trustee/reports",
      label: "Reports",
      comingSoon: false, // Phase 5
    },
    {
      path: "/admin/trustee/audit-log",
      label: "Audit Log",
      comingSoon: true, // Phase 6
    },
  ];

  /**
   * Determine if a nav item is the active route.
   * The overview item also matches the layout root path.
   */
  const isActive = (path) => {
    if (path === "/admin/trustee/overview") {
      return (
        location.pathname === path ||
        location.pathname === "/admin/trustee" ||
        location.pathname === "/admin/trustee/"
      );
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Module badge bar — consistent with other admin sub-layouts */}
      <div className="bg-emerald-700 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wide uppercase bg-emerald-800 px-2 py-0.5 rounded">
              Module
            </span>
            <span className="text-sm font-semibold">Finance Portal</span>
          </div>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm hover:underline font-medium"
          >
            ← Back to Admin Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Finance Portal
                </h2>
                <p className="text-xs text-emerald-700 font-medium mt-0.5">
                  Ashram ERP — Financial Operations
                </p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => !item.comingSoon && navigate(item.path)}
                    disabled={item.comingSoon}
                    className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      item.indent ? "pl-8 text-xs" : ""
                    } ${
                      item.comingSoon
                        ? "text-gray-400 cursor-not-allowed"
                        : isActive(item.path)
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-emerald-50"
                    }`}
                  >
                    {item.label}
                    {item.comingSoon && (
                      <span className="ml-2 text-[10px] uppercase tracking-widest text-gray-400">
                        Coming Soon
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default TrusteeLayout;
