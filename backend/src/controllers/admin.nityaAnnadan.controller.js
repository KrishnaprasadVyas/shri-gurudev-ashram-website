const NityaAnnadanBooking = require("../models/NityaAnnadanBooking");
const NityaAnnadanBlockedDate = require("../models/NityaAnnadanBlockedDate");
const { generateBookingReference } = require("../models/NityaAnnadanBooking");

const DEFAULT_SEVA_PRICE = Number(process.env.ANNADAN_SEVA_PRICE) || 2100;
const DEFAULT_SEVA_CAPACITY = Number(process.env.SEVA_CAPACITY_ANNADAN) || 100;

/**
 * 1. GET /api/admin/nitya-annadan/overview
 * Dashboard summary statistics for Nitya Annadan Admin Overview
 */
exports.getOverviewStats = async (req, res) => {
  try {
    const todayISO = new Date().toISOString().split("T")[0];
    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;

    // Current Month prefix YYYY-MM
    const currentMonthPrefix = todayISO.substring(0, 7);
    const monthRegex = new RegExp(`^${currentMonthPrefix}`);

    const [
      todayPaidBookings,
      todayPendingBookings,
      monthlyPaidAgg,
      totalLifetimeCount,
      totalPendingCount,
      todayPatrons,
      isTodayBlocked,
    ] = await Promise.all([
      NityaAnnadanBooking.countDocuments({ sevaDate: todayISO, status: "paid" }),
      NityaAnnadanBooking.countDocuments({ sevaDate: todayISO, status: "payment_pending" }),
      NityaAnnadanBooking.aggregate([
        {
          $match: {
            sevaDate: { $regex: monthRegex },
            status: "paid",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      NityaAnnadanBooking.countDocuments({ status: "paid" }),
      NityaAnnadanBooking.countDocuments({ status: "payment_pending" }),
      NityaAnnadanBooking.find({ sevaDate: todayISO, status: "paid" })
        .select("bookingReference fullName phoneNumber totalAmount notes createdAt")
        .sort({ createdAt: 1 }),
      NityaAnnadanBlockedDate.findOne({ date: todayISO }),
    ]);

    const monthlyRevenue = monthlyPaidAgg.length > 0 ? monthlyPaidAgg[0].totalRevenue : 0;
    const monthlyBookingsCount = monthlyPaidAgg.length > 0 ? monthlyPaidAgg[0].count : 0;
    const todayRemainingCapacity = Math.max(0, capacity - (todayPaidBookings + todayPendingBookings));

    res.json({
      success: true,
      stats: {
        todayISO,
        todayPaidBookings,
        todayPendingBookings,
        todayCapacity: capacity,
        todayRemainingCapacity,
        isTodayBlocked: !!isTodayBlocked,
        monthlyRevenue,
        monthlyBookingsCount,
        totalLifetimeCount,
        totalPendingCount,
      },
      todayPatrons,
    });
  } catch (error) {
    console.error("Get Nitya Annadan overview stats error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 2. GET /api/admin/nitya-annadan/bookings
 * Paginated Master Bookings Table with search and date filters
 */
exports.getAllBookings = async (req, res) => {
  try {
    const {
      status,
      dateFrom,
      dateTo,
      paymentMethod,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    if (status && status !== "all") {
      filter.status = status;
    }

    if (paymentMethod && paymentMethod !== "all") {
      filter.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      filter.sevaDate = {};
      if (dateFrom) filter.sevaDate.$gte = dateFrom;
      if (dateTo) filter.sevaDate.$lte = dateTo;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { fullName: searchRegex },
        { phoneNumber: searchRegex },
        { bookingReference: searchRegex },
        { razorpayOrderId: searchRegex },
        { razorpayPaymentId: searchRegex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      NityaAnnadanBooking.find(filter)
        .populate("addedBy", "fullName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      NityaAnnadanBooking.countDocuments(filter),
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Get Nitya Annadan bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 3. GET /api/admin/nitya-annadan/bookings/:id
 * Get single Nitya Annadan booking detail
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await NityaAnnadanBooking.findById(req.params.id).populate(
      "addedBy",
      "fullName email"
    );

    if (!booking) {
      return res.status(404).json({ message: "Nitya Annadan booking not found" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    console.error("Get Nitya Annadan booking by ID error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 4. POST /api/admin/nitya-annadan/bookings/offline
 * Add manual offline Nitya Annadan booking (Cash/UPI/Cheque)
 */
exports.createOfflineBooking = async (req, res) => {
  try {
    const { fullName, phoneNumber, sevaDate, totalAmount, paymentMethod, notes } = req.body;

    if (!fullName || !phoneNumber || !sevaDate) {
      return res.status(400).json({
        message: "Missing required fields (fullName, phoneNumber, sevaDate)",
      });
    }

    const validMethods = ["CASH", "UPI", "CHEQUE"];
    const method = paymentMethod && validMethods.includes(paymentMethod) ? paymentMethod : "CASH";
    const amount = Number(totalAmount) || Number(process.env.ANNADAN_SEVA_PRICE) || DEFAULT_SEVA_PRICE;

    // Capacity & Block check
    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;
    const blocked = await NityaAnnadanBlockedDate.findOne({ date: sevaDate });
    if (blocked) {
      return res.status(400).json({
        message: `Date (${sevaDate}) is blocked for Nitya Annadan Seva: ${blocked.reason}`,
      });
    }

    const bookedCount = await NityaAnnadanBooking.countDocuments({
      sevaDate,
      status: { $in: ["paid", "payment_pending"] },
    });

    if (bookedCount >= capacity) {
      return res.status(400).json({
        message: `Date (${sevaDate}) has reached maximum seva capacity (${capacity})`,
      });
    }

    const booking = new NityaAnnadanBooking({
      sevaType: "annadan",
      sevaDate,
      fullName,
      phoneNumber,
      totalAmount: amount,
      notes: notes || null,
      status: "paid", // Offline entry by admin is directly marked as paid
      paymentMethod: method,
      createdOffline: true,
      addedBy: req.user ? req.user.id : null,
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Offline Nitya Annadan booking added successfully",
      booking,
    });
  } catch (error) {
    console.error("Create offline Nitya Annadan booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 5. PATCH /api/admin/nitya-annadan/bookings/:id/status
 * Admin manual status override (payment_pending, paid, cancelled)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["payment_pending", "paid", "cancelled"];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const booking = await NityaAnnadanBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Nitya Annadan booking not found" });
    }

    booking.status = status;
    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to '${status}'`,
      booking,
    });
  } catch (error) {
    console.error("Update Nitya Annadan booking status error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 6. PATCH /api/admin/nitya-annadan/bookings/:id/reschedule
 * Reschedule sponsored date after checking capacity
 */
exports.rescheduleBooking = async (req, res) => {
  try {
    const { newSevaDate } = req.body;

    if (!newSevaDate || !/^\d{4}-\d{2}-\d{2}$/.test(newSevaDate)) {
      return res.status(400).json({ message: "Valid newSevaDate (YYYY-MM-DD) is required" });
    }

    const booking = await NityaAnnadanBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Nitya Annadan booking not found" });
    }

    if (booking.sevaDate === newSevaDate) {
      return res.status(400).json({ message: "Booking is already scheduled on this date" });
    }

    // Check capacity & block status of target date
    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;
    const blocked = await NityaAnnadanBlockedDate.findOne({ date: newSevaDate });
    if (blocked) {
      return res.status(400).json({
        message: `Target date (${newSevaDate}) is blocked: ${blocked.reason}`,
      });
    }

    const bookedCount = await NityaAnnadanBooking.countDocuments({
      sevaDate: newSevaDate,
      status: { $in: ["paid", "payment_pending"] },
    });

    if (bookedCount >= capacity) {
      return res.status(400).json({
        message: `Target date (${newSevaDate}) has reached maximum capacity (${capacity})`,
      });
    }

    const oldDate = booking.sevaDate;
    booking.sevaDate = newSevaDate;
    await booking.save();

    res.json({
      success: true,
      message: `Booking rescheduled from ${oldDate} to ${newSevaDate}`,
      booking,
    });
  } catch (error) {
    console.error("Reschedule Nitya Annadan booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 7. GET /api/admin/nitya-annadan/calendar
 * Fetch monthly calendar grid view with patrons list per date
 * Query: ?month=YYYY-MM
 */
exports.getCalendarView = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ message: "Query parameter ?month=YYYY-MM is required" });
    }

    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;
    const dateRegex = new RegExp(`^${month}`);

    const [bookings, blockedDates] = await Promise.all([
      NityaAnnadanBooking.find({
        sevaDate: { $regex: dateRegex },
        status: { $in: ["paid", "payment_pending"] },
      }).sort({ createdAt: 1 }),
      NityaAnnadanBlockedDate.find({ date: { $regex: dateRegex } }),
    ]);

    // Group bookings by date
    const dailyData = {};
    bookings.forEach((b) => {
      if (!dailyData[b.sevaDate]) {
        dailyData[b.sevaDate] = {
          bookedCount: 0,
          paidCount: 0,
          pendingCount: 0,
          patrons: [],
        };
      }
      dailyData[b.sevaDate].bookedCount += 1;
      if (b.status === "paid") dailyData[b.sevaDate].paidCount += 1;
      if (b.status === "payment_pending") dailyData[b.sevaDate].pendingCount += 1;

      dailyData[b.sevaDate].patrons.push({
        id: b._id,
        bookingReference: b.bookingReference,
        fullName: b.fullName,
        phoneNumber: b.phoneNumber,
        status: b.status,
        totalAmount: b.totalAmount,
        notes: b.notes,
        paymentMethod: b.paymentMethod,
      });
    });

    const blockedMap = {};
    blockedDates.forEach((b) => {
      blockedMap[b.date] = b.reason;
    });

    res.json({
      success: true,
      month,
      capacity,
      dailyData,
      blockedDates: blockedMap,
    });
  } catch (error) {
    console.error("Get Nitya Annadan calendar error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 8. GET /api/admin/nitya-annadan/daily-sheet
 * Fetch printable Daily Aarti & Mahaprasad announcement sheet
 * Query: ?date=YYYY-MM-DD
 */
exports.getDailyAartiSheet = async (req, res) => {
  try {
    const { date } = req.query;
    const todayISO = new Date().toISOString().split("T")[0];
    const targetDate = date || todayISO;

    const patrons = await NityaAnnadanBooking.find({
      sevaDate: targetDate,
      status: "paid",
    }).sort({ createdAt: 1 });

    const totalAmount = patrons.reduce((sum, p) => sum + p.totalAmount, 0);

    res.json({
      success: true,
      date: targetDate,
      count: patrons.length,
      totalAmount,
      patrons,
    });
  } catch (error) {
    console.error("Get daily Aarti sheet error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 9. GET /api/admin/nitya-annadan/reports
 * Fetch Nitya Annadan analytical reports and trends
 */
exports.getReports = async (req, res) => {
  try {
    const [statusBreakdown, methodBreakdown, monthlyTrends] = await Promise.all([
      NityaAnnadanBooking.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),
      NityaAnnadanBooking.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),
      NityaAnnadanBooking.aggregate([
        { $match: { status: "paid" } },
        {
          $group: {
            _id: { $substr: ["$sevaDate", 0, 7] }, // YYYY-MM
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      success: true,
      statusBreakdown,
      methodBreakdown,
      monthlyTrends,
    });
  } catch (error) {
    console.error("Get Nitya Annadan reports error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 10. GET /api/admin/nitya-annadan/export
 * Download Nitya Annadan bookings CSV
 */
exports.exportBookings = async (req, res) => {
  try {
    const { dateFrom, dateTo, status } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (dateFrom || dateTo) {
      filter.sevaDate = {};
      if (dateFrom) filter.sevaDate.$gte = dateFrom;
      if (dateTo) filter.sevaDate.$lte = dateTo;
    }

    const bookings = await NityaAnnadanBooking.find(filter).sort({ sevaDate: -1 });

    let csvContent = "Reference,Seva Date,Full Name,Phone Number,Amount,Status,Payment Method,Created Offline,Notes,Created At\n";

    bookings.forEach((b) => {
      const cleanNotes = (b.notes || "").replace(/"/g, '""');
      csvContent += `"${b.bookingReference}","${b.sevaDate}","${b.fullName}","${b.phoneNumber}",${b.totalAmount},"${b.status}","${b.paymentMethod}",${b.createdOffline},"${cleanNotes}","${b.createdAt.toISOString()}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=nitya_annadan_bookings_${new Date().toISOString().split("T")[0]}.csv`
    );
    res.status(200).send(csvContent);
  } catch (error) {
    console.error("Export Nitya Annadan bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 11. POST & DELETE /api/admin/nitya-annadan/blocked-dates
 * Block or unblock a date for Nitya Annadan Seva
 */
exports.blockDate = async (req, res) => {
  try {
    const { date, reason } = req.body;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: "Valid date (YYYY-MM-DD) is required" });
    }

    const existing = await NityaAnnadanBlockedDate.findOne({ date });
    if (existing) {
      existing.reason = reason || existing.reason;
      await existing.save();
      return res.json({ success: true, message: `Updated block reason for date ${date}`, blockedDate: existing });
    }

    const blocked = new NityaAnnadanBlockedDate({
      date,
      reason: reason || "Blocked by Ashram Admin",
      blockedBy: req.user ? req.user.id : null,
    });

    await blocked.save();
    res.status(201).json({ success: true, message: `Date ${date} blocked successfully`, blockedDate: blocked });
  } catch (error) {
    console.error("Block Nitya Annadan date error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.unblockDate = async (req, res) => {
  try {
    const { date } = req.params;
    const deleted = await NityaAnnadanBlockedDate.findOneAndDelete({ date });

    if (!deleted) {
      return res.status(404).json({ message: `Date ${date} is not currently blocked` });
    }

    res.json({ success: true, message: `Date ${date} unblocked successfully` });
  } catch (error) {
    console.error("Unblock Nitya Annadan date error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
