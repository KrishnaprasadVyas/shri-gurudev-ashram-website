const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ---------------- Donation Receipt Email ---------------- */

exports.sendDonationReceiptEmail = async (toEmail, receiptPath) => {
  await transporter.sendMail({
    from: `"Gurudev Ashram" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Donation Receipt - Gurudev Ashram",
    text: "Thank you for your donation. Please find the receipt attached.",
    attachments: [
      {
        filename: "Donation_Receipt.pdf",
        path: receiptPath,
      },
    ],
  });
};

/* ---------------- Contact Us Email ---------------- */

exports.sendContactEmail = async ({ name, email, phone, subject, message }) => {
  await transporter.sendMail({
    from: `"Gurudev Ashram Website" <${process.env.SMTP_USER}>`,
    to: process.env.CONTACT_RECEIVER_EMAIL,
    replyTo: email,
    subject: `[Contact Form] ${subject}`,
    html: `
      <h3>New Contact Message</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `,
  });
};
