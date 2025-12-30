const Donation = require("../models/Donation");

exports.createDonation = async (req, res) => {
  try {
    const { donationHead, amount } = req.body;

    if (!donationHead || !amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid donation data" });
    }

    const donation = await Donation.create({
      user: req.user._id,
      donationHead,
      amount,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Donation initiated",
      donationId: donation._id,
      status: donation.status,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
