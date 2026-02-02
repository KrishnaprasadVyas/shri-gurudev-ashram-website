const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Convert filesystem path to public URL path
 * @param {string} fileName - The receipt filename
 * @returns {string} Public URL path for the receipt
 */
const getPublicReceiptUrl = (fileName) => {
  return `/receipts/${fileName}`;
};

/**
 * Convert number to words (Indian format)
 */
const numberToWords = (num) => {
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

  if (num === 0) return "Zero";

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

  return result.trim();
};

/**
 * Generate donation receipt PDF
 * Clean table-based format similar to reference design
 */
exports.generateDonationReceipt = (donation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      const fileName = `receipt_${donation._id}.pdf`;
      const receiptsDir = path.join(__dirname, "../../receipts");

      // Ensure receipts directory exists
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Listen for finish event on the write stream
      writeStream.on("finish", () => {
        // Return FULL filesystem path for email attachments
        resolve(filePath);
      });

      writeStream.on("error", (err) => {
        reject(err);
      });

      // Colors
      const primaryColor = "#D97706"; // Orange color matching website
      const borderColor = "#CBD5E1"; // Light gray border
      const textDark = "#1E293B";
      const textLight = "#64748B";
      const highlightBg = "#FEF9C3"; // Light yellow for amount row

      // Page dimensions
      const pageWidth = 595.28;
      const margin = 50;
      const contentWidth = pageWidth - margin * 2;

      let yPos = margin;

      // ==================== LOGO & PHOTO ====================
      const logoPath = path.join(
        __dirname,
        "../../../frontend/public/assets/Logo.png",
      );
      const gurudevPath = path.join(
        __dirname,
        "../../../frontend/public/assets/gurudev.jpg",
      );

      const imageSize = 60;

      // Add Logo on the left
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, margin, yPos, {
            width: imageSize,
            height: imageSize,
          });
        } catch (err) {
          console.log("Could not load logo for receipt");
        }
      }

      // Add Gurudev photo on the right
      if (fs.existsSync(gurudevPath)) {
        try {
          doc.image(gurudevPath, pageWidth - margin - imageSize, yPos, {
            width: imageSize,
            height: imageSize,
          });
        } catch (err) {
          console.log("Could not load Gurudev photo for receipt");
        }
      }

      // ==================== HEADER - ASHRAM NAME ====================
      doc
        .fontSize(16)
        .fillColor(primaryColor)
        .font("Helvetica-Bold")
        .text(
          "Shri Gurudev Ashram Palaskhed Sapkal",
          margin + imageSize + 10,
          yPos + 10,
          {
            align: "center",
            width: contentWidth - imageSize * 2 - 20,
          },
        );

      // Contact info
      doc
        .fontSize(9)
        .fillColor(textDark)
        .font("Helvetica")
        .text(
          "Mo. 9158740007, 9834151577",
          margin + imageSize + 10,
          yPos + 30,
          {
            align: "center",
            width: contentWidth - imageSize * 2 - 20,
          },
        );

      doc.text(
        "Email: info@shrigurudevashram.org, info@shantiashramtrust.org",
        margin + imageSize + 10,
        yPos + 42,
        {
          align: "center",
          width: contentWidth - imageSize * 2 - 20,
        },
      );

      yPos += imageSize + 20;

      // ==================== RECEIPT NO & DATE LINE ====================
      const receiptNo =
        donation.receiptNumber ||
        donation._id.toString().slice(-5).toUpperCase();
      const dateStr = new Date(donation.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      doc
        .fontSize(11)
        .fillColor(textDark)
        .font("Helvetica-Bold")
        .text(`Receipt No. : ${receiptNo}`, margin, yPos);

      doc.text(`Date : ${dateStr}`, margin, yPos, {
        align: "right",
        width: contentWidth,
      });

      yPos += 25;

      // ==================== TABLE ====================
      const tableLeft = margin;
      const tableWidth = contentWidth;
      const col1Width = 140;
      const col2Width = tableWidth - col1Width;
      const rowHeight = 32;

      const drawTableRow = (label, value, isHighlighted = false) => {
        // Background for highlighted row
        if (isHighlighted) {
          doc
            .rect(tableLeft, yPos, tableWidth, rowHeight)
            .fillColor(highlightBg)
            .fill();
        }

        // Left cell border
        doc
          .rect(tableLeft, yPos, col1Width, rowHeight)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();

        // Left cell text
        doc
          .fontSize(10)
          .fillColor(textDark)
          .font("Helvetica-Bold")
          .text(label, tableLeft + 10, yPos + 10, {
            width: col1Width - 20,
          });

        // Right cell border
        doc
          .rect(tableLeft + col1Width, yPos, col2Width, rowHeight)
          .strokeColor(borderColor)
          .lineWidth(1)
          .stroke();

        // Right cell text
        doc
          .fontSize(10)
          .fillColor(textDark)
          .font("Helvetica")
          .text(value || "-", tableLeft + col1Width + 10, yPos + 10, {
            width: col2Width - 20,
          });

        yPos += rowHeight;
      };

      // Donor Name
      const donorName = donation.donor.anonymousDisplay
        ? "Anonymous Donor"
        : donation.donor.name;
      drawTableRow("Donor Name", donorName);

      // Mobile & Email
      const contactInfo = donation.donor.email
        ? `${donation.donor.mobile}   |   ${donation.donor.email}`
        : donation.donor.mobile;
      drawTableRow("Mobile & Email", contactInfo);

      // Address (taller row)
      const addressRowHeight = 48;

      doc
        .rect(tableLeft, yPos, col1Width, addressRowHeight)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(10)
        .fillColor(textDark)
        .font("Helvetica-Bold")
        .text("Address", tableLeft + 10, yPos + 16);

      doc
        .rect(tableLeft + col1Width, yPos, col2Width, addressRowHeight)
        .strokeColor(borderColor)
        .lineWidth(1)
        .stroke();

      doc
        .fontSize(10)
        .fillColor(textDark)
        .font("Helvetica")
        .text(
          donation.donor.address || "-",
          tableLeft + col1Width + 10,
          yPos + 8,
          {
            width: col2Width - 20,
          },
        );

      yPos += addressRowHeight;

      // PAN
      const idLabel = "PAN";
      drawTableRow(
        idLabel,
        donation.donor.idNumber,
      );

      // On Account of (Donation Head)
      drawTableRow(
        "On Account of",
        donation.donationHead.name || donation.donationHead,
      );

      // Payment Mode
      drawTableRow("Payment Mode", "Online (Razorpay)");

      // Donation Amount (highlighted)
      const amountInWords = numberToWords(donation.amount);
      const amountText = `Rs ${donation.amount.toLocaleString("en-IN")} (${amountInWords})`;
      drawTableRow("Donation Amount", amountText, true);

      // ==================== THANK YOU MESSAGE ====================
      yPos += 30;
      doc
        .fontSize(10)
        .fillColor(textLight)
        .font("Helvetica-Oblique")
        .text(
          "Thank you for your generous contribution. May your seva be blessed.",
          margin,
          yPos,
          {
            align: "center",
            width: contentWidth,
          },
        );

      // Transaction ID (small, at bottom)
      yPos += 20;
      if (donation.paymentId) {
        doc
          .fontSize(8)
          .fillColor(textLight)
          .font("Helvetica")
          .text(`Transaction ID: ${donation.paymentId}`, margin, yPos, {
            align: "center",
            width: contentWidth,
          });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Get public URL for a receipt (for API responses)
 * @param {string} filePath - Full filesystem path to receipt
 * @returns {string} Public URL path
 */
exports.getReceiptPublicUrl = (filePath) => {
  const fileName = path.basename(filePath);
  return `/receipts/${fileName}`;
};
