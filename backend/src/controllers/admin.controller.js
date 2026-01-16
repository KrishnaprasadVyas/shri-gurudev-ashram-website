const Donation = require("../models/Donation");
const User = require("../models/User");

exports.getAllDonations = async (req, res) => {
  const donations = await Donation.find()
    .populate("user", "fullName email mobile")
    .sort({ createdAt: -1 });

  res.json(donations);
};

exports.getAllDonors = async (req, res) => {
  const donors = await User.find({ role: "USER" }).select(
    "fullName email mobile createdAt"
  );

  res.json(donors);
};

exports.getReports = async (req, res) => {
  const totalAmount = await Donation.aggregate([
    { $match: { status: "SUCCESS" } },
    { $group: { _id: null, sum: { $sum: "$amount" } } },
  ]);

  res.json({
    totalAmount: totalAmount[0]?.sum || 0,
  });
};
