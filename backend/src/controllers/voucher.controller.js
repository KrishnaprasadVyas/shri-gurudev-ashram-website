const fs = require("fs");
const Voucher = require("../models/Voucher");
const { generateVoucherPdf } = require("../services/voucher.service");

/**
 * 1. List Vouchers with filters
 * GET /api/finance/vouchers
 */
exports.listVouchers = async (req, res) => {
  try {
    const { sourceType, category, search } = req.query;
    const filter = {};

    if (sourceType) filter.sourceType = sourceType;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { voucherNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { personName: { $regex: search, $options: "i" } },
      ];
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 200;
    const skip = (page - 1) * limit;

    const [vouchers, total] = await Promise.all([
      Voucher.find(filter)
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .populate("preparedBy", "name email phone"),
      Voucher.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      count: vouchers.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: vouchers,
    });
  } catch (err) {
    console.error("Error in listVouchers:", err);
    return res.status(500).json({ message: "Server error retrieving expense vouchers." });
  }
};

/**
 * 2. Get Single Voucher by ID
 * GET /api/finance/vouchers/:id
 */
exports.getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid voucher ID format." });
    }

    const voucher = await Voucher.findById(id)
      .populate("preparedBy", "name email phone")
      .populate("sourceId");

    if (!voucher) {
      return res.status(404).json({ message: "Expense voucher not found." });
    }

    return res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (err) {
    console.error("Error in getVoucherById:", err);
    return res.status(500).json({ message: "Server error retrieving expense voucher details." });
  }
};

/**
 * 3. Download / Stream Voucher PDF (Lazy Generation)
 * GET /api/finance/vouchers/:id/pdf
 */
exports.downloadVoucherPdf = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid voucher ID format." });
    }

    const voucher = await Voucher.findById(id).populate("preparedBy", "name email");
    if (!voucher) {
      return res.status(404).json({ message: "Expense voucher not found." });
    }

    // Lazy generation: if PDF not cached on disk, generate now
    if (!voucher.pdfPath || !fs.existsSync(voucher.pdfPath)) {
      const pdfPath = await generateVoucherPdf(voucher);
      voucher.pdfPath = pdfPath;
      voucher.pdfGeneratedAt = new Date();
      await voucher.save();
    }

    const fileName = `Voucher_${voucher.voucherNumber || voucher._id}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(voucher.pdfPath);
    fileStream.pipe(res);
  } catch (err) {
    console.error("Error in downloadVoucherPdf:", err);
    return res.status(500).json({ message: "Server error generating or streaming voucher PDF." });
  }
};
