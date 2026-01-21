import { Outlet, useNavigate, useLocation } from "react-router-dom";

const WebsiteAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/admin/website/gallery", label: "Gallery", active: false },
    { path: "/admin/website/events", label: "Events", active: false, disabled: false },
    { path: "/admin/website/activities", label: "Activities", active: false, disabled: false },
    { path: "/admin/website/announcement", label: "Announcement Banner", active: false, disabled: false },
    { path: "/admin/website/testimonials", label: "Testimonials", active: false, disabled: false },
  ];

  const isActive = (path) => {
    // Also highlight gallery when on index route
    if (path === "/admin/website/gallery") {
      return location.pathname === path || location.pathname === "/admin/website";
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Mode Badge */}
      <div className="bg-amber-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold">Admin Mode</span>
          <button
            onClick={() => navigate("/admin")}
            className="text-sm hover:underline"
          >
            Back to Admin Home
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Navigation */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Website Admin</h2>
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => !item.disabled && navigate(item.path)}
                    disabled={item.disabled}
                    className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                      isActive(item.path)
                        ? "bg-amber-600 text-white"
                        : item.disabled
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-amber-50"
                    }`}
                  >
                    {item.label}
                    {item.disabled && (
                      <span className="ml-2 text-xs">(Coming Soon)</span>
                    )}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAdminLayout;
