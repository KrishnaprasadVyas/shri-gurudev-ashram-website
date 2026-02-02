const nodemailer = require("nodemailer");
const fs = require("fs");

/**
 * Email Service using Brevo (Sendinblue) SMTP
 * Used for: Donation receipts, Email verification
 * NOT used for: OTP (handled via WhatsApp)
 */

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const getFromAddress = () => {
  const name = process.env.SMTP_FROM_NAME || "Gurudev Ashram";
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  return `"${name}" <${email}>`;
};

/* ---------------- Email Verification Email ---------------- */

/**
 * Send email verification link
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.verificationLink - Full verification URL
 * @returns {Promise<boolean>} - true if email sent successfully
 */
exports.sendEmailVerification = async ({ to, verificationLink }) => {
  try {
    if (!to || !verificationLink) {
      return false;
    }

    await transporter.sendMail({
      from: getFromAddress(),
      to,
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
                <a href="${verificationLink}" 
                   style="background-color: #d97706; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Verify Email
                </a>
              </div>
              <p style="color: #6b7280; font-size: 14px; line-height: 1.5;">
                This link will expire in <strong>15 minutes</strong>. If you did not request this, please ignore this email.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${verificationLink}" style="color: #d97706; word-break: break-all;">${verificationLink}</a>
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
      text: `Verify your email for Gurudev Ashram\n\nClick this link to verify: ${verificationLink}\n\nThis link expires in 15 minutes.`,
    });

    return true;
  } catch (error) {
    console.error("Verification email failed:", error.message);
    return false;
  }
};

// Legacy function for backward compatibility
exports.sendEmailVerificationEmail = async (toEmail, verificationToken) => {
  const frontendUrl = process.env.FRONTEND_URL || "https://shrigurudevashram.org";
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
  return exports.sendEmailVerification({ to: toEmail, verificationLink });
};

/* ---------------- Donation Receipt Email ---------------- */

/**
 * Send donation receipt email with PDF attachment
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.donorName - Donor's name for personalization
 * @param {number} params.amount - Donation amount
 * @param {string} params.receiptUrl - Full filesystem path to the receipt PDF
 * @returns {Promise<boolean>} - true if email sent successfully
 */
exports.sendDonationReceiptEmail = async ({ to, donorName, amount, receiptUrl }) => {
  try {
    // For backward compatibility: support old signature (toEmail, receiptPath)
    let email = to;
    let name = donorName;
    let receiptPath = receiptUrl;

    // Handle legacy call: sendDonationReceiptEmail(email, path)
    if (typeof to === "string" && typeof donorName === "string" && !amount && !receiptUrl) {
      email = to;
      receiptPath = donorName;
      name = "Valued Donor";
    }

    if (!receiptPath || !fs.existsSync(receiptPath)) {
      console.error("Receipt email failed: Receipt file not found");
      return false;
    }

    if (!email) {
      console.error("Receipt email failed: No recipient email");
      return false;
    }

    const formattedAmount = amount 
      ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount)
      : "";

    await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Donation Receipt - Gurudev Ashram",
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
              <h2 style="color: #92400e; margin-top: 0;">Thank You for Your Donation${name ? `, ${name}` : ""}!</h2>
              <p style="color: #4b5563; line-height: 1.6;">
                We are deeply grateful for your generous contribution${formattedAmount ? ` of <strong>${formattedAmount}</strong>` : ""}. 
                Your support helps us continue our mission and serve the community.
              </p>
              <p style="color: #4b5563; line-height: 1.6;">
                Please find your official donation receipt attached to this email for your records.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #d97706; padding: 15px; margin: 20px 0;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Note:</strong> This receipt can be used for tax exemption purposes under Section 80G of the Income Tax Act.
                </p>
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Shri Gurudev Ashram, Palaskhed (Sapkal)<br>
                May you be blessed with peace and prosperity.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Thank you for your donation${name ? `, ${name}` : ""}!\n\n${formattedAmount ? `Amount: ${formattedAmount}\n\n` : ""}Please find your donation receipt attached.\n\nMay you be blessed with peace and prosperity.\n\n- Shri Gurudev Ashram`,
      attachments: [
        {
          filename: "Donation_Receipt.pdf",
          path: receiptPath,
        },
      ],
    });

    return true;
  } catch (error) {
    console.error("Receipt email failed:", error.message);
    return false;
  }
};

/* ---------------- Contact Us Email ---------------- */

exports.sendContactEmail = async ({ name, email, phone, subject, message }) => {
  try {
    await transporter.sendMail({
      from: getFromAddress(),
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
    return true;
  } catch (error) {
    console.error("Contact email failed:", error.message);
    throw error;
  }
};
