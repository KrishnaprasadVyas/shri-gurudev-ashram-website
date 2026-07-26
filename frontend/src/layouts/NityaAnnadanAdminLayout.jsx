import { Outlet, useNavigate, useLocation } from "react-router-dom";

const NityaAnnadanAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    {
      path: "/admin/nitya-annadan/overview",
      label: "Overview",
    },
    {
      path: "/admin/nitya-annadan/calendar",
      label: "Calendar & Daily Roster",
    },
    {
      path: "/admin/nitya-annadan/bookings",
      label: "Bookings Master Table",
    },
    {
      path: "/admin/nitya-annadan/add-offline",
      label: "Add Offline Seva",
      indent: true,
    },
    {
      path: "/admin/nitya-annadan/reports",
      label: "Reports & Analytics",
    },
  ];

  const isActive = (path) => {
    if (path === "/admin/nitya-annadan/overview") {
      return (
        location.pathname === path ||
        location.pathname === "/admin/nitya-annadan" ||
        location.pathname === "/admin/nitya-annadan/"
      );
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Mode Badge */}
      <div className="bg-amber-600 text-white py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-wide uppercase bg-amber-700 px-2 py-0.5 rounded">
              Module
            </span>
            <span className="text-sm font-semibold">
              Nitya Annadan Admin Mode
            </span>
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
          {/* Left Navigation Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
              <div className="border-b border-gray-100 pb-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900">
                  Nitya Annadan Seva
                </h2>
                <p className="text-xs text-amber-700 font-medium mt-0.5">
                  Daily Mahaprasad Management
                </p>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      item.indent ? "pl-8 text-xs" : ""
                    } ${
                      isActive(item.path)
                        ? "bg-amber-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-amber-50"
                    }`}
                  >
                    {item.label}
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

export default NityaAnnadanAdminLayout;
