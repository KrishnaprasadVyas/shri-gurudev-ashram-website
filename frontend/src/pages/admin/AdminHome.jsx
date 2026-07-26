import { useNavigate } from "react-router-dom";

const AdminHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-8">
      <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Website Admin Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Website Admin</h2>
              <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                CMS
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Manage public website content, gallery, events, activities, and hero banners
            </p>
            <ul className="space-y-2 mb-8 text-gray-700 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Gallery & Categories
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Events & Activities
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Announcement & Banners
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Testimonials & Donation Causes
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate("/admin/website")}
            className="w-full py-2.5 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors text-sm"
          >
            Enter Website Admin
          </button>
        </div>

        {/* System Admin Card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 flex flex-col justify-between hover:shadow-xl transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">System Admin</h2>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                Financials
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Manage online & cash donations, donor profiles, collectors, and reports
            </p>
            <ul className="space-y-2 mb-8 text-gray-700 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                General Donations Ledger
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Add Offline Cash / UPI / Cheque
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Donors & Collectors Management
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Reports & Data Exports
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate("/admin/system")}
            className="w-full py-2.5 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 transition-colors text-sm"
          >
            Enter System Admin
          </button>
        </div>

        {/* Nitya Annadan Admin Card */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-amber-500 p-6 flex flex-col justify-between hover:shadow-xl transition-shadow relative">
          <div className="absolute -top-3 right-4 bg-amber-600 text-white text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full">
            Seva Portal
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Nitya Annadan Admin</h2>
            </div>
            <p className="text-gray-600 text-sm mb-6">
              Manage daily Mahaprasad seva bookings, calendar capacity, and Aarti rosters
            </p>
            <ul className="space-y-2 mb-8 text-gray-700 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Daily Patron Calendar & Capacity
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Bookings Master Roster
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Print Daily Aarti Sheet
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-amber-600 rounded-full mr-3"></span>
                Add Offline Seva Sponsorship
              </li>
            </ul>
          </div>
          <button
            onClick={() => navigate("/admin/nitya-annadan")}
            className="w-full py-2.5 bg-amber-700 text-white font-semibold rounded-md hover:bg-amber-800 transition-colors text-sm"
          >
            Enter Nitya Annadan Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
