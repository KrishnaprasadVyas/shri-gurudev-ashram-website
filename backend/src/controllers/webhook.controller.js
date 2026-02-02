const crypto = require("crypto");
const fs = require("fs");
const Donation = require("../models/Donation");
const {
  generateDonationReceipt,
  getReceiptPublicUrl,
} = require("../services/receipt.service");
const { sendDonationReceiptEmail } = require("../services/email.service");

exports.handleRazorpayWebhook = async (req, res) => {
  try {
    /* ---------------- Signature Verification ---------------- */

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());
    console.log(event)
    const eventType = event.event;

    console.log("Webhook received:", eventType);

    /* ---------------- Handle SUCCESS ---------------- */

    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Atomic update to prevent race condition on duplicate webhooks
      const receiptNumber = `GRD-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;
      
      const donation = await Donation.findOneAndUpdate(
        { razorpayOrderId: orderId, status: "PENDING" },
        {
          $set: {
            status: "SUCCESS",
            paymentId: paymentId,
            transactionRef: paymentId,
            receiptNumber: receiptNumber,
          },
        },
        { new: true }
      );

      if (!donation) {
        // Either not found or already processed
        console.log("Donation not found or already processed for order:", orderId);
        return res.json({ status: "ok" });
      }

      // Generate receipt PDF (returns full filesystem path)
      let receiptPath = null;
      try {
        receiptPath = await generateDonationReceipt(donation);

        // Verify the file was actually created before storing
        if (receiptPath && fs.existsSync(receiptPath)) {
          // Store the public URL path, not the filesystem path
          donation.receiptUrl = getReceiptPublicUrl(receiptPath);
          await donation.save();
          console.log("Receipt generated successfully:", receiptPath);
        } else {
          console.error(
            "Receipt generation failed: File not found after generation",
          );
        }
      } catch (receiptErr) {
        console.error("Receipt generation error:", receiptErr.message);
      }

      // Send email ONLY if:
      // 1. Receipt was successfully generated
      // 2. Donor opted in for email AND has verified email
      if (receiptPath && fs.existsSync(receiptPath)) {
        const shouldSendEmail =
          donation.donor?.emailOptIn === true &&
          donation.donor?.emailVerified === true &&
          donation.donor?.email;

        if (shouldSendEmail) {
          const emailSent = await sendDonationReceiptEmail(
            donation.donor.email,
            receiptPath,
          );

          if (emailSent) {
            donation.emailSent = true;
            await donation.save();
          }
        }
      }

      return res.json({ status: "ok" });
    }

    /* ---------------- Handle FAILURE ---------------- */

    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;

      const donation = await Donation.findOne({
        razorpayOrderId: orderId,
      });

      if (!donation) {
        console.log("No donation found for failed payment:", orderId);
        return res.json({ status: "ok" });
      }

      if (donation.status === "SUCCESS" || donation.status === "FAILED") {
        return res.json({ status: "ok" });
      }

      donation.status = "FAILED";
      donation.transactionRef = payment.id;

      // Store failure reason from Razorpay error object
      if (payment.error_description) {
        donation.failureReason = payment.error_description;
      } else if (payment.error_reason) {
        donation.failureReason = payment.error_reason;
      } else {
        donation.failureReason = "Payment failed";
      }

      await donation.save();

      console.log("Donation marked FAILED:", donation._id);

      return res.json({ status: "ok" });
    }

    return res.json({ status: "ignored" });
  } catch (err) {
    console.error("Webhook error:", err);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};
