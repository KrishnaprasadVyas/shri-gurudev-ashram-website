/**
 * Ashram ERP — Phase 8 Donation Receipt PDF Verification
 *
 * Exercises the existing receipt generator without changing receipt numbering
 * or persisting any database documents. Generated fixture PDFs are deleted
 * after each case; a pre-existing sentinel PDF is hash-checked to confirm it
 * is not changed by new receipt generation.
 */
const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { generateDonationReceipt, getPaymentReference } = require("../src/services/receipt.service");

const receiptsDir = path.join(process.cwd(), "receipts");
const fixtureIds = [];
let checks = 0;

const check = (condition, message) => {
  checks += 1;
  assert.ok(condition, message);
  console.log(`[PASS] ${message}`);
};

const buildDonation = (id, method, payment = {}, legacy = {}) => ({
  _id: id,
  receiptNumber: `PH8-${id.slice(-6)}`,
  createdAt: new Date("2026-07-26T00:00:00.000Z"),
  donor: {
    name: "Phase Eight Test Donor",
    mobile: "9999999999",
    address: "Datala, Malkapur, Maharashtra, 443101",
    idNumber: "ABCDE1234F",
  },
  donationHead: { id: "test", name: "General Seva" },
  amount: 1000,
  paymentMethod: method,
  payment: { method, status: "SUCCESS", ...payment },
  ...legacy,
});

async function verifyReceipt(donation, expectedReference, label) {
  fixtureIds.push(donation._id);
  check(getPaymentReference(donation) === expectedReference, `${label}: payment reference is resolved correctly`);
  const receiptPath = await generateDonationReceipt(donation);
  const content = fs.readFileSync(receiptPath);
  check(content.subarray(0, 4).toString() === "%PDF", `${label}: new receipt PDF renders successfully`);
}

async function run() {
  fs.mkdirSync(receiptsDir, { recursive: true });
  const sentinelPath = path.join(receiptsDir, `phase8-existing-receipt-${process.pid}.pdf`);
  const sentinelContent = Buffer.from("existing receipt PDF must remain unchanged");
  fs.writeFileSync(sentinelPath, sentinelContent);
  const sentinelHash = crypto.createHash("sha256").update(sentinelContent).digest("hex");

  try {
    await verifyReceipt(buildDonation("phase8cash00000000000001", "CASH"), null, "Cash");
    await verifyReceipt(buildDonation("phase8upi000000000000002", "UPI", { utrNumber: "UPI-UTR-123456" }), "UPI UTR: UPI-UTR-123456", "UPI");
    await verifyReceipt(buildDonation("phase8cheque000000000003", "CHEQUE", {
      chequeNumber: "000123", bankName: "State Bank of India", chequeDate: "2026-07-20",
    }), "Cheque No: 000123 | Bank: State Bank of India | Date: 20/07/2026", "Cheque");
    await verifyReceipt(buildDonation("phase8rtgs000000000000004", "RTGS", {
      referenceNumber: "RTGS-REF-123", bankName: "Bank of Maharashtra",
    }), "RTGS Ref: RTGS-REF-123 | Bank: Bank of Maharashtra", "RTGS");
    await verifyReceipt(buildDonation("phase8neft000000000000005", "NEFT", {
      referenceNumber: "NEFT-REF-456", bankName: "HDFC Bank",
    }), "NEFT Ref: NEFT-REF-456 | Bank: HDFC Bank", "NEFT");
    await verifyReceipt(buildDonation("phase8online000000000006", "ONLINE", {}, { paymentId: "pay_Razorpay123" }), "Razorpay Payment ID: pay_Razorpay123", "Online");

    const finalSentinelHash = crypto.createHash("sha256").update(fs.readFileSync(sentinelPath)).digest("hex");
    check(finalSentinelHash === sentinelHash, "Existing receipt PDF on disk remains unchanged");
    console.log(`Phase 8 receipt PDF suite: ${checks}/${checks} passed`);
  } finally {
    for (const id of fixtureIds) {
      fs.rmSync(path.join(receiptsDir, `receipt_${id}.pdf`), { force: true });
    }
    fs.rmSync(sentinelPath, { force: true });
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
