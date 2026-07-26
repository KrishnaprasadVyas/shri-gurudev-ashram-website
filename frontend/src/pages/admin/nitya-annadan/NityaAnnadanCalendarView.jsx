import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatCurrency, formatDate } from "../../../utils/helpers";
import { API_BASE_URL, parseJsonResponse } from "../../../utils/api";
import { useAuth } from "../../../context/AuthContext";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Printer, Lock, Unlock, Users } from "lucide-react";

const NityaAnnadanCalendarView = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  
  // Current selected month YYYY-MM
  const todayISO = new Date().toISOString().split("T")[0];
  const [currentMonth, setCurrentMonth] = useState(todayISO.substring(0, 7));
  const [selectedDate, setSelectedDate] = useState(todayISO);
  
  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Block modal / toggle state
  const [blockReason, setBlockReason] = useState("");
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const fetchCalendar = async (monthStr) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/calendar?month=${monthStr}`,
        {
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Nitya Annadan calendar data");
      }

      const data = await parseJsonResponse(response);
      setCalendarData(data);
    } catch (err) {
      console.error("Error fetching calendar:", err);
      setError(err.message || "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar(currentMonth);
  }, [currentMonth]);

  const handlePrevMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const prevDate = new Date(y, m - 2, 1);
    const newMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const [y, m] = currentMonth.split("-").map(Number);
    const nextDate = new Date(y, m, 1);
    const newMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, "0")}`;
    setCurrentMonth(newMonth);
  };

  const handleBlockDate = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setIsSubmittingBlock(true);
      const response = await fetch(`${API_BASE_URL}/admin/nitya-annadan/blocked-dates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          date: selectedDate,
          reason: blockReason || "Blocked by Ashram Admin",
        }),
      });

      if (!response.ok) throw new Error("Failed to block date");
      setBlockReason("");
      await fetchCalendar(currentMonth);
    } catch (err) {
      alert(err.message || "Could not block date");
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  const handleUnblockDate = async () => {
    if (!selectedDate) return;

    try {
      setIsSubmittingBlock(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/nitya-annadan/blocked-dates/${selectedDate}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token || localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to unblock date");
      await fetchCalendar(currentMonth);
    } catch (err) {
      alert(err.message || "Could not unblock date");
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Render Calendar Grid Days
  const renderCalendarDays = () => {
    const [yStr, mStr] = currentMonth.split("-");
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10) - 1;

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Empty padding slots
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(<div key={`pad-${i}`} className="h-24 bg-gray-50/50 border border-gray-100 rounded-md"></div>);
    }

    const { dailyData = {}, blockedDates = {}, capacity = 100 } = calendarData || {};

    for (let day = 1; day <= totalDays; day++) {
      const dayFormatted = String(day).padStart(2, "0");
      const dateKey = `${currentMonth}-${dayFormatted}`;
      const isSelected = dateKey === selectedDate;
      const isToday = dateKey === todayISO;

      const dayInfo = dailyData[dateKey] || { bookedCount: 0, paidCount: 0, patrons: [] };
      const isBlocked = !!blockedDates[dateKey];
      const booked = dayInfo.bookedCount;
      const remaining = Math.max(0, capacity - booked);

      let badgeColor = "bg-green-100 text-green-800 border-green-200";
      if (isBlocked) badgeColor = "bg-red-100 text-red-800 border-red-200";
      else if (booked >= capacity) badgeColor = "bg-red-100 text-red-800 border-red-200";
      else if (booked > 0) badgeColor = "bg-amber-100 text-amber-800 border-amber-200";

      days.push(
        <button
          key={dateKey}
          onClick={() => setSelectedDate(dateKey)}
          className={`h-24 p-2 text-left border rounded-md transition-all flex flex-col justify-between relative ${
            isSelected
              ? "ring-2 ring-amber-600 border-amber-600 bg-amber-50/30 shadow-md"
              : "bg-white border-gray-200 hover:border-amber-400 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                isToday ? "bg-amber-600 text-white" : "text-gray-900"
              }`}
            >
              {day}
            </span>
            {isBlocked && <Lock className="w-3.5 h-3.5 text-red-600" />}
          </div>

          <div className="mt-1">
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${badgeColor}`}>
              {isBlocked ? "BLOCKED" : `${booked}/${capacity} Booked`}
            </span>
            {!isBlocked && (
              <p className="text-[10px] text-gray-500 mt-1">
                {remaining} left
              </p>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  const selectedDayInfo = calendarData?.dailyData?.[selectedDate] || { bookedCount: 0, paidCount: 0, patrons: [] };
  const isSelectedBlocked = !!calendarData?.blockedDates?.[selectedDate];
  const selectedBlockedReason = calendarData?.blockedDates?.[selectedDate];

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nitya Annadan Calendar & Roster</h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage daily Mahaprasad availability, seat capacity, and daily Aarti sheets
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevMonth}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <span className="text-lg font-bold text-gray-900 min-w-[140px] text-center">
            {new Date(currentMonth + "-01").toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          <span className="ml-3 text-gray-600 font-medium">Loading Calendar...</span>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-red-600">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Month Grid (2 Columns) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-500 uppercase">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
          </div>

          {/* Selected Date Detail Panel (1 Column) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {formatDate(selectedDate)}
                </h3>
                <p className="text-xs text-gray-500">Selected Date Details</p>
              </div>
              <button
                onClick={() => navigate(`/admin/nitya-annadan/print-sheet?date=${selectedDate}`)}
                className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded hover:bg-gray-800 transition-colors"
                title="Print Aarti Sheet for this date"
              >
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print Sheet
              </button>
            </div>

            {/* Date Capacity Summary */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">Booked Seats:</span>
                <span className="font-bold text-amber-900">
                  {selectedDayInfo.bookedCount} / {calendarData?.capacity || 100}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Status:</span>
                <span
                  className={`font-bold text-xs px-2 py-0.5 rounded ${
                    isSelectedBlocked
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {isSelectedBlocked ? "BLOCKED" : "AVAILABLE"}
                </span>
              </div>
              {isSelectedBlocked && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  Reason: {selectedBlockedReason}
                </p>
              )}
            </div>

            {/* Block / Unblock Action */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center">
                {isSelectedBlocked ? (
                  <Unlock className="w-4 h-4 mr-1 text-green-600" />
                ) : (
                  <Lock className="w-4 h-4 mr-1 text-red-600" />
                )}
                Date Access Control
              </h4>
              {isSelectedBlocked ? (
                <button
                  onClick={handleUnblockDate}
                  disabled={isSubmittingBlock}
                  className="w-full py-2 bg-green-600 text-white font-semibold rounded text-xs hover:bg-green-700 transition-colors"
                >
                  {isSubmittingBlock ? "Unblocking..." : "Unblock Date"}
                </button>
              ) : (
                <form onSubmit={handleBlockDate} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Reason for blocking (e.g. Festival event)"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingBlock}
                    className="w-full py-2 bg-red-600 text-white font-semibold rounded text-xs hover:bg-red-700 transition-colors"
                  >
                    {isSubmittingBlock ? "Blocking..." : "Block Date"}
                  </button>
                </form>
              )}
            </div>

            {/* Patron Roster List for Selected Date */}
            <div>
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-amber-600" />
                Confirmed Patrons ({selectedDayInfo.patrons?.length || 0})
              </h4>

              {selectedDayInfo.patrons?.length === 0 ? (
                <div className="p-4 bg-gray-50 rounded border border-dashed border-gray-200 text-xs text-gray-500 text-center">
                  No confirmed bookings for this date yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {selectedDayInfo.patrons.map((patron, idx) => (
                    <div
                      key={patron.id || idx}
                      className="p-3 bg-white border border-gray-200 rounded-md text-xs hover:border-amber-400 transition-colors"
                    >
                      <div className="flex items-center justify-between font-semibold text-gray-900">
                        <span>{patron.fullName}</span>
                        <span className="font-mono text-amber-700">{patron.bookingReference}</span>
                      </div>
                      <div className="text-gray-600 mt-1 flex justify-between">
                        <span>Phone: {patron.phoneNumber}</span>
                        <span>{formatCurrency(patron.totalAmount)}</span>
                      </div>
                      {patron.notes && (
                        <p className="text-gray-500 italic mt-1 bg-amber-50/50 p-1.5 rounded">
                          "{patron.notes}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NityaAnnadanCalendarView;
