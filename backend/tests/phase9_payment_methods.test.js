/**
 * Ashram ERP - Phase 9 RTGS / NEFT offline donation verification.
 * Exercises the production route and model; test donations and PDFs are
 * removed afterwards. Issued receipt counters are deliberately not rewound.
 */
require("dotenv").config();
const assert = require("assert");
const express = require("express");
const http = require("http");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("../src/config/db");
const { mainDb } = connectDB;
const User = require("../src/models/User");
const Donation = require("../src/models/Donation");
const { getPaymentReference } = require("../src/services/receipt.service");
const systemRoutes = require("../src/routes/admin.system.routes");

const TEST_MOBILE = "9999999989";
const createdDonationIds = [];
let server;
let baseUrl;
let admin;
let checks = 0;

const check = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
  console.log(`[PASS] ${message}`);
};

const donationPayload = (method, referenceNumber, bankName) => ({
  donor: {
    name: `Phase 9 ${method} Donor`,
    mobile: "9999999988",
    address: "Datala, Malkapur, Maharashtra, 443101",
    dob: "1990-01-01",
    idType: "PAN",
    idNumber: "ABCDE1234F",
  },
  donationHead: { id: "phase9", name: "General Seva" },
  amount: 1000,
  paymentDate: "2026-07-26",
  paymentMethod: method,
  paymentDetails: { referenceNumber, bankName },
});

async function postDonation(token, payload) {
  const response = await fetch(`${baseUrl}/api/admin/system/donations/offline`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return { response, data };
}

async function run() {
  await connectDB();
  await User.deleteMany({ mobile: TEST_MOBILE });
  admin = await User.create({ mobile: TEST_MOBILE, role: "SYSTEM_ADMIN" });
  const token = jwt.sign(
    { userId: admin._id.toString(), role: "SYSTEM_ADMIN" },
    process.env.JWT_SECRET || "fallback_secret_key_for_testing",
    { expiresIn: "1h" },
  );

  const app = express();
  app.use(express.json());
  app.use("/api/admin/system", systemRoutes);
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  }));

  try {
    for (const [method, reference, bank] of [
      ["RTGS", "RTGS-REF-123", "State Bank of India"],
      ["NEFT", "NEFT-REF-456", "HDFC Bank"],
    ]) {
      const { response, data } = await postDonation(token, donationPayload(method, reference, bank));
      check(response.status === 201, `${method} donation can be created through the offline donation API`);
      createdDonationIds.push(data.donationId);

      const donation = await Donation.findById(data.donationId);
      check(donation.paymentMethod === method && donation.payment.method === method, `${method} is persisted in both payment method fields`);
      check(donation.payment.referenceNumber === reference && donation.payment.bankName === bank, `${method} reference number and bank are persisted`);
      check(getPaymentReference(donation) === `${method} Ref: ${reference} | Bank: ${bank}`, `${method} receipt displays its reference and bank`);
      check(/^CA-\d{6}$/.test(donation.receiptNumber), `${method} uses the established receipt-numbering fallback without changing numbering rules`);
      const receiptPath = path.join(process.cwd(), "receipts", `receipt_${donation._id}.pdf`);
      check(fs.existsSync(receiptPath) && fs.readFileSync(receiptPath).subarray(0, 4).toString() === "%PDF", `${method} receipt PDF is generated successfully`);
    }
    console.log(`Phase 9 payment-method suite: ${checks}/${checks} passed`);
  } finally {
    for (const id of createdDonationIds) {
      const receiptPath = path.join(process.cwd(), "receipts", `receipt_${id}.pdf`);
      fs.rmSync(receiptPath, { force: true });
    }
    await mainDb.collection("donations").deleteMany({ _id: { $in: createdDonationIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    await User.deleteMany({ mobile: TEST_MOBILE });
    if (server) await new Promise((resolve) => server.close(resolve));
    await mainDb.close();
    await connectDB.sharedDb.close();
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
