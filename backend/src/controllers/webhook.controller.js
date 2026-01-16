const crypto = require("crypto");
const Donation = require("../models/Donation");
const User = require("../models/User");
const { generateDonationReceipt } = require("../services/receipt.service");
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
    const eventType = event.event;
    console.log(event);

    console.log("Webhook received:", eventType);

    /* ---------------- Handle SUCCESS ---------------- */

    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      const donation = await Donation.findOne({
        razorpayOrderId: orderId,
      });

      if (!donation) {
        console.log("No donation found for order:", orderId);
        return res.json({ status: "ok" });
      }

      if (donation.status === "SUCCESS") {
        console.log("Donation already SUCCESS:", donation._id);
        return res.json({ status: "ok" });
      }

      donation.status = "SUCCESS";
      donation.paymentId = paymentId;
      donation.transactionRef = paymentId;

      donation.receiptNumber = `GRD-${new Date().getFullYear()}-${donation._id
        .toString()
        .slice(-6)
        .toUpperCase()}`;

      await donation.save();

      const user = await User.findById(donation.user);

      const receiptPath = await generateDonationReceipt(donation, user);
      donation.receiptUrl = receiptPath;

      await donation.save();

      const recipientEmail = user?.email || process.env.CONTACT_RECEIVER_EMAIL;

      try {
        await sendDonationReceiptEmail(recipientEmail, receiptPath);
      } catch (emailErr) {
        console.error("Receipt email failed:", emailErr.message);
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
