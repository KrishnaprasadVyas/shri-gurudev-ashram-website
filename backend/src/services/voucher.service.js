const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Convert number to Indian words
 */
const numberToWords = (num) => {
  if (isNaN(num) || num === null) return "Zero";
  num = Math.round(Number(num));
  if (num === 0) return "Zero";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convertLessThanThousand = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + convertLessThanThousand(n % 100) : "")
    );
  };

  let result = "";
  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + " Crore ";
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + " Lakh ";
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + " Thousand ";
    num %= 1000;
  }
  if (num > 0) {
    result += convertLessThanThousand(num);
  }
  return result.trim() + " Only";
};

/**
 * Generates an Expense Voucher PDF
 * @param {Object} voucher - Voucher document object
 * @returns {Promise<string>} Filesystem path to generated PDF
 */
exports.generateVoucherPdf = (voucher) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const vouchersDir = path.join(process.cwd(), "vouchers");

      if (!fs.existsSync(vouchersDir)) {
        fs.mkdirSync(vouchersDir, { recursive: true });
      }

      const filePath = path.join(vouchersDir, `voucher_${voucher._id}.pdf`);
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      stream.on("finish", () => resolve(filePath));
      stream.on("error", (err) => reject(err));

      // Styling colors
      const primaryColor = "#1e3a8a"; // Navy
      const darkColor = "#1f2937";
      const grayColor = "#6b7280";
      const lightBg = "#f3f4f6";

      // Border
      doc
        .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
        .lineWidth(2)
        .stroke(primaryColor);
      doc
        .rect(24, 24, doc.page.width - 48, doc.page.height - 48)
        .lineWidth(0.5)
        .stroke(primaryColor);

      let y = 50;

      // Title
      doc
        .fillColor(primaryColor)
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("SHRI GURUDEV ASHRAM", 50, y, { align: "center" });
      y += 25;

      doc
        .fillColor(darkColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("OFFICIAL EXPENSE VOUCHER", 50, y, { align: "center" });
      y += 30;

      // Divider line
      doc
        .moveTo(50, y)
        .lineTo(doc.page.width - 50, y)
        .lineWidth(1.5)
        .stroke("#e5e7eb");
      y += 20;

      // Voucher Header Metadata
      const formattedDate = voucher.date
        ? new Date(voucher.date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : new Date().toLocaleDateString("en-IN");

      doc.fontSize(10).font("Helvetica").fillColor(grayColor);
      doc.text("VOUCHER NUMBER:", 50, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.voucherNumber || "N/A", 160, y);

      doc.font("Helvetica").fillColor(grayColor).text("DATE:", 360, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(formattedDate, 410, y);
      y += 20;

      doc.font("Helvetica").fillColor(grayColor).text("SOURCE TYPE:", 50, y);
      doc
        .font("Helvetica-Bold")
        .fillColor(darkColor)
        .text(voucher.sourceType === "DIRECT_PAYMENT" ? "Direct Payment" : "Advance Settlement", 160, y);

      doc.font("Helvetica").fillColor(grayColor).text("CATEGORY:", 360, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.category || "GENERAL", 430, y);
      y += 25;

      // Recipient & Title Box
      doc.rect(50, y, doc.page.width - 100, 60).fillAndStroke(lightBg, "#d1d5db");
      y += 12;
      doc.fontSize(10).font("Helvetica").fillColor(grayColor).text("PAYEE / RECIPIENT:", 65, y);
      doc.font("Helvetica-Bold").fillColor(primaryColor).fontSize(12).text(voucher.personName || "N/A", 180, y - 1);
      y += 22;
      doc.fontSize(10).font("Helvetica").fillColor(grayColor).text("EXPENSE TITLE:", 65, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.title || "N/A", 180, y);
      y += 40;

      // Financial Highlights Table
      doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor).text("FINANCIAL SUMMARY", 50, y);
      y += 18;

      const colWidth = (doc.page.width - 100) / 3;
      // Headers
      doc.rect(50, y, doc.page.width - 100, 22).fillAndStroke(primaryColor, primaryColor);
      doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
      doc.text("ADVANCE GIVEN", 50, y + 6, { width: colWidth, align: "center" });
      doc.text("ACTUAL EXPENSE (VOUCHER)", 50 + colWidth, y + 6, { width: colWidth, align: "center" });
      doc.text("AMOUNT RETURNED", 50 + colWidth * 2, y + 6, { width: colWidth, align: "center" });
      y += 22;

      // Values
      doc.rect(50, y, doc.page.width - 100, 28).fillAndStroke("#ffffff", "#d1d5db");
      doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(11);
      const advStr = voucher.advanceAmount !== null && voucher.advanceAmount !== undefined ? `INR ${Number(voucher.advanceAmount).toLocaleString("en-IN")}` : "N/A (Direct)";
      const actStr = `INR ${Number(voucher.actualAmount || 0).toLocaleString("en-IN")}`;
      const retStr = voucher.returnedAmount !== null && voucher.returnedAmount !== undefined ? `INR ${Number(voucher.returnedAmount).toLocaleString("en-IN")}` : "N/A";
      
      doc.text(advStr, 50, y + 8, { width: colWidth, align: "center" });
      doc.fillColor("#059669").text(actStr, 50 + colWidth, y + 8, { width: colWidth, align: "center" });
      doc.fillColor(darkColor).text(retStr, 50 + colWidth * 2, y + 8, { width: colWidth, align: "center" });
      y += 45;

      // Amount in Words
      doc.fontSize(10).font("Helvetica").fillColor(grayColor).text("Amount in words:", 50, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(numberToWords(voucher.actualAmount || 0), 150, y);
      y += 25;

      // Itemized Line Items
      if (voucher.items && voucher.items.length > 0) {
        doc.font("Helvetica-Bold").fontSize(11).fillColor(primaryColor).text("ITEMIZED BREAKDOWN", 50, y);
        y += 18;

        doc.rect(50, y, doc.page.width - 100, 20).fillAndStroke("#e5e7eb", "#d1d5db");
        doc.fillColor(darkColor).font("Helvetica-Bold").fontSize(9);
        doc.text("S.No", 55, y + 5, { width: 40 });
        doc.text("Description", 100, y + 5, { width: 230 });
        doc.text("Category", 340, y + 5, { width: 100 });
        doc.text("Amount (INR)", 440, y + 5, { width: 80, align: "right" });
        y += 20;

        voucher.items.forEach((item, index) => {
          doc.rect(50, y, doc.page.width - 100, 22).stroke("#e5e7eb");
          doc.fillColor(darkColor).font("Helvetica").fontSize(9);
          doc.text(String(index + 1), 55, y + 6, { width: 40 });
          doc.text(item.description || "", 100, y + 6, { width: 230 });
          doc.text(item.category || "", 340, y + 6, { width: 100 });
          doc.text(Number(item.amount || 0).toLocaleString("en-IN"), 440, y + 6, { width: 80, align: "right" });
          y += 22;
        });
        y += 15;
      }

      // Payment Details Box
      doc.rect(50, y, doc.page.width - 100, 50).fillAndStroke("#ffffff", "#e5e7eb");
      y += 10;
      doc.fontSize(9).font("Helvetica").fillColor(grayColor).text("PAYMENT MODE:", 60, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.paymentMode || "CASH", 150, y);

      doc.font("Helvetica").fillColor(grayColor).text("PAYMENT REF:", 300, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.paymentRef || "N/A", 390, y);
      y += 18;

      doc.font("Helvetica").fillColor(grayColor).text("BANK NAME:", 60, y);
      doc.font("Helvetica-Bold").fillColor(darkColor).text(voucher.bankName || "N/A", 150, y);

      doc.font("Helvetica").fillColor(grayColor).text("PAYMENT DATE:", 300, y);
      const pDate = voucher.paymentDate ? new Date(voucher.paymentDate).toLocaleDateString("en-IN") : "N/A";
      doc.font("Helvetica-Bold").fillColor(darkColor).text(pDate, 390, y);
      y += 45;

      // Signatures
      y = Math.max(y, doc.page.height - 130);
      doc.moveTo(60, y + 30).lineTo(200, y + 30).lineWidth(1).stroke("#9ca3af");
      doc.moveTo(350, y + 30).lineTo(490, y + 30).lineWidth(1).stroke("#9ca3af");

      doc.fontSize(9).font("Helvetica-Bold").fillColor(darkColor);
      doc.text("Prepared By", 60, y + 35, { width: 140, align: "center" });
      doc.text("Trustee / Authorized Signatory", 350, y + 35, { width: 140, align: "center" });

      // Footer
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .fillColor("#9ca3af")
        .text(
          "This is a system-generated computer voucher for Shri Gurudev Ashram financial records.",
          50,
          doc.page.height - 55,
          { align: "center", width: doc.page.width - 100 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
