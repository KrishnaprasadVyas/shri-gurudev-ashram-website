const { sendContactEmail } = require("../services/email.service");

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await sendContactEmail({
      name,
      email,
      phone,
      subject,
      message,
    });

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ message: "Failed to send message" });
  }
};
