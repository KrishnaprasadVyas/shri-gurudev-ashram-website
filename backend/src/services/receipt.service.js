const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.generateDonationReceipt = (donation, user) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    const fileName = `receipt_${donation._id}.pdf`;
    const filePath = path.join(__dirname, "../../receipts", fileName);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(20).text("Donation Receipt", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Receipt No: ${donation.receiptNumber}`);
    doc.text(`Date: ${new Date(donation.createdAt).toLocaleDateString()}`);
    doc.moveDown();

    doc.text(`Donor Name: ${user.fullname || "Donor"}`);
    doc.text(`Mobile: ${user.mobile}`);
    doc.text(`Email: ${user.email || "-"}`);
    doc.moveDown();

    doc.text(`Donation Head: ${donation.donationHead}`);
    doc.text(`Amount: ${donation.amount}`);
    doc.text(`Payment ID: ${donation.paymentId}`);
    doc.text(`Status: SUCCESS`);
    doc.moveDown();

    doc.text(`Thank you for your generous contribution.`, {
      align: "center",
    });

    doc.end();

    resolve(filePath);
  });
};
