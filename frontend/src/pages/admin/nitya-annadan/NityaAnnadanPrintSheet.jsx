import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { formatDate } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Printer, ArrowLeft } from "lucide-react";

const NityaAnnadanPrintSheet = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const dateParam = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(dateParam);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSheet = async (dateStr) => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/daily-sheet?date=${dateStr}`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch daily Aarti sheet");

      const result = await parseJsonResponse(response);
      setData(result);
    } catch (err) {
      console.error("Fetch Aarti sheet error:", err);
      setError(err.message || "Could not load sheet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSheet(date);
  }, [date]);

  const handlePrint = () => {
    window.print();
  };

  const { patrons = [], count = 0 } = data || {};

  return (
    <div className="min-h-screen bg-white p-8 max-w-4xl mx-auto text-gray-900 font-sans">
      {/* Screen-only Controls (Hidden during print) */}
      <div className="print:hidden mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/nitya-annadan/calendar")}
            className="inline-flex items-center text-xs font-semibold text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Calendar
          </button>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-700">Select Date:</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 bg-gray-900 text-white font-semibold text-sm rounded shadow hover:bg-gray-800 transition-colors"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Announcement Sheet
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-500">Loading daily announcement sheet...</div>
      ) : error ? (
        <div className="py-12 text-center text-red-600 font-semibold">{error}</div>
      ) : (
        <div className="print:p-0">
          {/* Official Ashram Letterhead Header */}
          <div className="border-b-2 border-gray-900 pb-4 mb-6 text-center">
            <h1 className="text-2xl font-extrabold uppercase tracking-wide text-gray-900">
              Shri Gurudev Ashram
            </h1>
            <h2 className="text-lg font-bold text-amber-900 mt-0.5">
              Nitya Annadan Seva — Daily Aarti & Mahaprasad Announcement Roster
            </h2>
            <div className="mt-3 flex justify-between items-center text-sm font-semibold border-t border-gray-200 pt-2 px-2">
              <span>Seva Date: <strong className="text-amber-900">{formatDate(date)}</strong> ({date})</span>
              <span>Total Sponsoring Patrons: <strong>{count}</strong></span>
            </div>
          </div>

          {/* Patrons Roster Printable Table */}
          {patrons.length === 0 ? (
            <div className="py-12 text-center text-gray-500 border border-dashed border-gray-300 rounded">
              No confirmed Nitya Annadan sponsors for this date ({date}).
            </div>
          ) : (
            <table className="w-full text-left border-collapse border border-gray-900 text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-900 uppercase font-bold border-b border-gray-900">
                  <th className="py-2.5 px-3 border-r border-gray-900 w-12 text-center">#</th>
                  <th className="py-2.5 px-3 border-r border-gray-900 w-28">Reference</th>
                  <th className="py-2.5 px-3 border-r border-gray-900 w-48">Devotee Full Name</th>
                  <th className="py-2.5 px-3 border-r border-gray-900 w-32">Mobile Number</th>
                  <th className="py-2.5 px-3">Dedication Notes / Family Names</th>
                </tr>
              </thead>
              <tbody>
                {patrons.map((patron, idx) => (
                  <tr key={patron._id || idx} className="border-b border-gray-300">
                    <td className="py-2.5 px-3 border-r border-gray-900 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-900 font-mono font-bold">
                      {patron.bookingReference}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-900 font-bold text-gray-900">
                      {patron.fullName}
                    </td>
                    <td className="py-2.5 px-3 border-r border-gray-900">
                      {patron.phoneNumber}
                    </td>
                    <td className="py-2.5 px-3 italic text-gray-800">
                      {patron.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Footer Signature Bar */}
          <div className="mt-12 border-t border-gray-300 pt-6 flex justify-between items-end text-xs text-gray-700">
            <div>
              <p className="font-bold">Prepared By: Ashram Office Manager</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Printed at: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-gray-400 w-48 mb-1"></div>
              <p className="font-bold">Pujari / Kitchen In-Charge Signature</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NityaAnnadanPrintSheet;
