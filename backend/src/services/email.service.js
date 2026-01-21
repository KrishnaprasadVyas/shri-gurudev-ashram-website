const nodemailer = require("nodemailer");
const fs = require("fs");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/* ---------------- Email Verification Email ---------------- */

/**
 * Send email verification link
 * @param {string} toEmail - Recipient email address
 * @param {string} verificationToken - Raw (unhashed) token for the link
 * @returns {Promise<boolean>} - true if email sent successfully
 */
exports.sendEmailVerificationEmail = async (toEmail, verificationToken) => {
  try {
    // Build verification URL using frontend domain
    const frontendUrl =
      process.env.FRONTEND_URL || "https://shrigurudevashram.org";
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    await transporter.sendMail({
      from: `"Gurudev Ashram" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: "Verify Your Email - Gurudev Ashram",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Gurudev Ashram</h1>
            </div>
            <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #92400e; margin-top: 0;">Verify Your Email Address</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                Thank you for providing your email address. Please click the button below to verify your email and receive donation receipts.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationUrl}" 
                   style="background-color: #d97706; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Verify Email
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong>15 minutes</strong>. If you did not request this, please ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationUrl}" style="color: #d97706; word-break: break-all;">${verificationUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Shri Gurudev Ashram, Palaskhed (Sapkal)
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Verify your email for Gurudev Ashram\n\nClick this link to verify: ${verificationUrl}\n\nThis link expires in 15 minutes.`,
    });

    console.log("Verification email sent to:", toEmail);
    return true;
  } catch (error) {
    console.error("Verification email failed:", error.message);
    return false;
  }
};

/* ---------------- Donation Receipt Email ---------------- */

/**
 * Send donation receipt email with PDF attachment
 * @param {string} toEmail - Recipient email address
 * @param {string} receiptPath - Full filesystem path to the receipt PDF
 * @returns {Promise<boolean>} - true if email sent successfully, false otherwise
 */
exports.sendDonationReceiptEmail = async (toEmail, receiptPath) => {
  // Safety check: verify receipt file exists before attempting to send
  if (!receiptPath || !fs.existsSync(receiptPath)) {
    console.error(
      "Receipt email failed: Receipt file not found at",
      receiptPath,
    );
    return false;
  }

  try {
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
    console.log("Receipt email sent successfully to:", toEmail);
    return true;
  } catch (error) {
    console.error("Receipt email failed:", error.message);
    return false;
  }
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
