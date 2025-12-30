const Otp = require("../models/Otp");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.sendOtp = async (req, res) => {
  const { mobile } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);

  const otpHash = await bcrypt.hash(otp.toString(), 10);

  await Otp.create({
    mobile,
    otpHash,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  console.log("OTP:", otp); // Replace with WhatsApp/SMS later

  res.json({ message: "OTP sent" });
};

exports.verifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  const record = await Otp.findOne({ mobile }).sort({ _id: -1 });
  if (!record) return res.status(400).json({ message: "Invalid OTP" });

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) return res.status(400).json({ message: "Invalid OTP" });

  let user = await User.findOne({ mobile });
  if (!user) user = await User.create({ mobile });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ token });
};
