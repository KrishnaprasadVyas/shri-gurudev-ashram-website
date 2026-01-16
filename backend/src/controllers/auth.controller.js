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

  if (!mobile || !otp) {
    return res.status(400).json({ message: "Mobile and OTP required" });
  }

  const record = await Otp.findOne({ mobile }).sort({ _id: -1 });
  if (!record) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (record.expiresAt < new Date()) {
    await Otp.deleteMany({ mobile });
    return res.status(400).json({ message: "OTP expired" });
  }

  const isValid = await bcrypt.compare(otp.toString(), record.otpHash);
  if (!isValid) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  let user = await User.findOne({ mobile });
  if (!user) {
    user = await User.create({ mobile });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  await Otp.deleteMany({ mobile });

  // Store session cookie for all users
  res.cookie("authToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.json({ token });
};
