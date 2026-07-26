const NityaAnnadanBooking = require("../models/NityaAnnadanBooking");
const NityaAnnadanBlockedDate = require("../models/NityaAnnadanBlockedDate");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");

const DEFAULT_SEVA_PRICE = Number(process.env.ANNADAN_SEVA_PRICE) || 2100;
const DEFAULT_SEVA_CAPACITY = Number(process.env.SEVA_CAPACITY_ANNADAN) || 100;

/**
 * 1. GET /api/nitya-annadan/pricing
 * Public endpoint to fetch current Nitya Annadan seva pricing
 */
exports.getPricing = async (req, res) => {
  try {
    const price = Number(process.env.ANNADAN_SEVA_PRICE) || DEFAULT_SEVA_PRICE;
    res.json({
      success: true,
      pricing: {
        annadan: price,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("Get Nitya Annadan pricing error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 2. GET /api/nitya-annadan/availability
 * Public endpoint to check daily or monthly availability & capacity
 * Query Params: ?month=YYYY-MM OR ?date=YYYY-MM-DD
 */
exports.getAvailability = async (req, res) => {
  try {
    const { month, date } = req.query;
    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;

    if (date) {
      // Single Date Availability Check
      const blocked = await NityaAnnadanBlockedDate.findOne({ date });
      const bookedCount = await NityaAnnadanBooking.countDocuments({
        sevaDate: date,
        status: { $in: ["paid", "payment_pending"] },
      });

      const remaining = Math.max(0, capacity - bookedCount);
      const isAvailable = !blocked && remaining > 0;

      return res.json({
        success: true,
        type: "annadan",
        date,
        capacity,
        booked: bookedCount,
        remainingSeats: remaining,
        available: isAvailable,
        isBlocked: !!blocked,
        blockedReason: blocked ? blocked.reason : null,
      });
    }

    if (month) {
      // Month-wide Availability Check (e.g. month=2026-08)
      const dateRegex = new RegExp(`^${month}`);
      
      const [bookings, blockedDates] = await Promise.all([
        NityaAnnadanBooking.aggregate([
          {
            $match: {
              sevaDate: { $regex: dateRegex },
              status: { $in: ["paid", "payment_pending"] },
            },
          },
          {
            $group: {
              _id: "$sevaDate",
              booked: { $sum: 1 },
            },
          },
        ]),
        NityaAnnadanBlockedDate.find({ date: { $regex: dateRegex } }),
      ]);

      const bookedMap = {};
      bookings.forEach((b) => {
        bookedMap[b._id] = b.booked;
      });

      const blockedSet = new Set(blockedDates.map((b) => b.date));
      const blockedReasonMap = {};
      blockedDates.forEach((b) => {
        blockedReasonMap[b.date] = b.reason;
      });

      // Construct monthly availability map
      const availability = {};
      const [yearStr, monthStr] = month.split("-");
      const year = parseInt(yearStr, 10);
      const monthIdx = parseInt(monthStr, 10) - 1;
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dayFormatted = String(day).padStart(2, "0");
        const dateKey = `${month}-${dayFormatted}`;
        const booked = bookedMap[dateKey] || 0;
        const isBlocked = blockedSet.has(dateKey);
        const remaining = Math.max(0, capacity - booked);
        const available = !isBlocked && remaining > 0;

        availability[dateKey] = {
          booked,
          capacity,
          remaining,
          available,
          isBlocked,
          blockedReason: isBlocked ? blockedReasonMap[dateKey] : null,
        };
      }

      return res.json({
        success: true,
        type: "annadan",
        month,
        capacity,
        availability,
      });
    }

    return res.status(400).json({
      message: "Please provide either ?month=YYYY-MM or ?date=YYYY-MM-DD parameter",
    });
  } catch (error) {
    console.error("Get Nitya Annadan availability error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 3. POST /api/nitya-annadan
 * Create draft Nitya Annadan booking (status: 'payment_pending')
 */
exports.createBooking = async (req, res) => {
  try {
    const { sevaDate, fullName, phoneNumber, totalAmount, notes } = req.body;

    if (!sevaDate || !fullName || !phoneNumber) {
      return res.status(400).json({
        message: "Missing required fields (sevaDate, fullName, phoneNumber)",
      });
    }

    const price = Number(process.env.ANNADAN_SEVA_PRICE) || DEFAULT_SEVA_PRICE;
    const bookingAmount = Number(totalAmount) || price;

    if (bookingAmount <= 0) {
      return res.status(400).json({ message: "Total amount must be greater than 0" });
    }

    // Capacity & Block check
    const capacity = Number(process.env.SEVA_CAPACITY_ANNADAN) || DEFAULT_SEVA_CAPACITY;
    const blocked = await NityaAnnadanBlockedDate.findOne({ date: sevaDate });
    if (blocked) {
      return res.status(400).json({
        message: `Selected date (${sevaDate}) is blocked for Nitya Annadan Seva: ${blocked.reason}`,
      });
    }

    const bookedCount = await NityaAnnadanBooking.countDocuments({
      sevaDate,
      status: { $in: ["paid", "payment_pending"] },
    });

    if (bookedCount >= capacity) {
      return res.status(400).json({
        message: `Selected date (${sevaDate}) has reached maximum seva capacity (${capacity})`,
      });
    }

    const booking = new NityaAnnadanBooking({
      userId: req.user ? req.user.id : null,
      sevaType: "annadan",
      sevaDate,
      fullName,
      phoneNumber,
      totalAmount: bookingAmount,
      notes: notes || null,
      status: "payment_pending",
      paymentMethod: "ONLINE",
    });

    await booking.save();

    res.status(201).json({
      success: true,
      message: "Nitya Annadan booking draft created",
      booking,
    });
  } catch (error) {
    console.error("Create Nitya Annadan booking error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 4. POST /api/nitya-annadan/create-order
 * Create Razorpay Order for Nitya Annadan booking
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await NityaAnnadanBooking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Nitya Annadan booking not found" });
    }

    if (booking.status === "paid") {
      return res.status(400).json({ message: "Booking is already paid" });
    }

    const options = {
      amount: Math.round(booking.totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking._id.toString(),
        bookingReference: booking.bookingReference,
        sevaDate: booking.sevaDate,
        fullName: booking.fullName,
      },
    };

    const order = await razorpay.orders.create(options);

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      key: process.env.RAZORPAY_KEY_ID,
      booking,
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);
    res.status(500).json({ message: "Failed to create Razorpay order" });
  }
};

/**
 * 5. POST /api/nitya-annadan/verify-payment
 * Verify Razorpay payment signature & update booking status to 'paid'
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification parameters" });
    }

    const booking = await NityaAnnadanBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Nitya Annadan booking not found" });
    }

    // Verify Razorpay HMAC SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: "Invalid payment signature verification" });
    }

    booking.status = "paid";
    booking.razorpayOrderId = razorpay_order_id;
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.razorpaySignature = razorpay_signature;
    await booking.save();

    res.json({
      success: true,
      message: "Payment verified and Nitya Annadan booking confirmed",
      booking,
    });
  } catch (error) {
    console.error("Verify Nitya Annadan payment error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
};

/**
 * 6. GET /api/nitya-annadan/upcoming
 * Fetch user's active upcoming Nitya Annadan bookings
 */
exports.getUpcomingBookings = async (req, res) => {
  try {
    const todayISO = new Date().toISOString().split("T")[0];
    const bookings = await NityaAnnadanBooking.find({
      userId: req.user.id,
      sevaDate: { $gte: todayISO },
      status: { $in: ["paid", "payment_pending"] },
    }).sort({ sevaDate: 1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get upcoming Nitya Annadan bookings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 7. GET /api/nitya-annadan/history
 * Fetch user's full Nitya Annadan booking history
 */
exports.getUserHistory = async (req, res) => {
  try {
    const bookings = await NityaAnnadanBooking.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error("Get Nitya Annadan history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
