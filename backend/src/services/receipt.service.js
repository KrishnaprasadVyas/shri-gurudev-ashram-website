const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Convert filesystem path to public URL path
 * @param {string} filePath - The full filesystem path or filename
 * @returns {string} Public URL path for the receipt
 */
const getReceiptPublicUrl = (filePath) => {
  const fileName = require("path").basename(filePath);
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

exports.generateDonationReceipt = (donation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });

      const fileName = `receipt_${donation._id}.pdf`;
      const receiptsDir = path.join(process.cwd(), "receipts");

      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }

      const filePath = path.join(receiptsDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);

      const pageWidth = doc.page.width;
      const contentWidth = pageWidth - 100;
      let y = 50;

      // ===== PAGE BORDER (ORANGE) =====
      const borderMargin = 20;
      doc
        .strokeColor("#FF6600")
        .lineWidth(3)
        .rect(borderMargin, borderMargin, pageWidth - 2 * borderMargin, doc.page.height - 2 * borderMargin)
        .stroke();

      const imageSize = 100; // Original size
      const imageRadius = imageSize / 2;

      // ===== LOGO (TOP LEFT - CIRCULAR) =====
      const logoPath = path.join(__dirname, "../../assets/recieptLogo.jpeg");
      if (fs.existsSync(logoPath)) {
        doc.save();
        doc.circle(50 + imageRadius, 50 + imageRadius, imageRadius).clip();
        doc.image(logoPath, 50, 50, {
          width: imageSize,
          height: imageSize,
        });
        doc.restore();
        
        // Circular border
        doc
          .strokeColor("#E69138")
          .lineWidth(2.5)
          .circle(50 + imageRadius, 50 + imageRadius, imageRadius)
          .stroke();
      }

      // ===== GURUDEV IMAGE (TOP RIGHT - CIRCULAR) =====
      const gurudevPath = path.join(__dirname, "../../assets/gurudev.jpeg");
      if (fs.existsSync(gurudevPath)) {
        const rightX = pageWidth - 50 - imageSize;
        doc.save();
        doc.circle(rightX + imageRadius, 50 + imageRadius, imageRadius).clip();
        // Shift image slightly left to center face in circle
        doc.image(gurudevPath, rightX - 8, 50, {
          width: imageSize,
          height: imageSize,
        });
        doc.restore();
        
        // Circular border
        doc
          .strokeColor("#E69138")
          .lineWidth(2.5)
          .circle(rightX + imageRadius, 50 + imageRadius, imageRadius)
          .stroke();
        
        // Text below gurudev image
        doc
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .fontSize(8)
          .text(
            "Swami Harichaitanyanand",
            rightX,
            50 + imageSize + 6,
            { align: "center", width: imageSize }
          )
          .text(
            "Sarswati Ji Maharaj",
            rightX,
            50 + imageSize + 17,
            { align: "center", width: imageSize }
          );
      }

      // ===== TRUST NAME (CENTER BETWEEN IMAGES - RED) =====
      const centerTextX = 50 + imageSize + 10;
      const centerTextWidth = pageWidth - (50 + imageSize + 10) * 2;

      doc
        .fillColor("#E69138")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(
          "SWAMI HARICHAITNYA SHANTI",
          centerTextX,
          70,
          { align: "center", width: centerTextWidth }
        );

      doc
        .fillColor("#E69138")
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(
          "AASHRAM TRUST",
          centerTextX,
          90,
          { align: "center", width: centerTextWidth }
        );

      // ===== HEAD OFFICE (BELOW TRUST NAME) =====
      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "Head office : Datala, Malkapur Dist. Buldhana,Maharashtra - 443101(INDIA)",
          centerTextX,
          115,
          { align: "center", width: centerTextWidth, lineBreak: false }
        );

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "Branch office : Palaskhed Sapkal, Chikhali,Dist Buldhana, Maharashtra - 443001",
          centerTextX,
          128,
          { align: "center", width: centerTextWidth, lineBreak: false }
        );

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Mob.:+91 9834151577 , 9158750007 , 9422881942 , 9422884005",
          centerTextX,
          141,
          { align: "center", width: centerTextWidth }
        );

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(7.5)
        .text(
          "E-mail : sevatirthdham@gmail.com | Website : www.sevatirth.com",
          centerTextX,
          153,
          { align: "center", width: centerTextWidth }
        );

y = 50 + imageSize + 20; // Move title up more

      // ===== TITLE =====
      doc
        .fillColor("#FF6600")
        .font("Helvetica-Bold")
        .fontSize(13.5)
        .text("Donation Receipt", 50, y, {
          align: "center",
          width: contentWidth,
        });

      y += 18;

      // ===== ORANGE LINE =====
      doc
        .strokeColor("#FF6600")
        .lineWidth(1.5)
        .moveTo(50, y)
        .lineTo(pageWidth - 50, y)
        .stroke();

      y += 15;

      // ===== RECEIPT NO & DATE =====
      const receiptNo = donation.receiptNumber || "N/A";

      const d = new Date(donation.createdAt);
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(
        d.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${d.getFullYear()}`;

      // Calculate table positions for alignment
      const tableWidth = 480;
      const tableX = (pageWidth - tableWidth) / 2;

      doc.fillColor("#000000").font("Helvetica-Bold").fontSize(9.5).text(`Receipt No. : ${receiptNo}`, tableX, y);

      doc.font("Helvetica-Bold").text(`Date : ${dateStr}`, tableX, y, {
        align: "right",
        width: tableWidth,
      });

      y += 20;

      // ===== TABLE LAYOUT =====
      const col1Width = 160; // Label column
      const col2Width = tableWidth - col1Width; // Value column
      const rowHeight = 45; // Taller rows for vertical spacing
      const cellPadding = 12; // More padding

      const tableData = [
        {
          label: "Donor Name",
          value: donation.donor.anonymousDisplay ? "Anonymous Donor" : donation.donor.name,
          valueBold: false
        },
        {
          label: "Mobile",
          value: donation.donor.mobile
        },
        {
          label: "Address",
          value: donation.donor.address || "-"
        },
        {
          label: "PAN",
          value: donation.donor.idNumber || "-"
        },
        {
          label: "On Account of",
          value: donation.donationHead.name || donation.donationHead
        },
        {
          label: "Payment Mode",
          value: donation.paymentMode || "Cash"
        },
        {
          label: "Donation Amount",
          value: `Rs ${donation.amount} (${numberToWords(donation.amount)})`
        }
      ];

      const tableStartY = y;

      // Draw table
      tableData.forEach((row, index) => {
        const currentY = tableStartY + (index * rowHeight);
        const isDonationAmount = row.label === "Donation Amount";

        // Light orange background for donation amount value cell only (right cell)
        if (isDonationAmount) {
          doc
            .fillColor("#FFE6CC")
            .rect(tableX + col1Width, currentY, col2Width, rowHeight)
            .fill();
        }

        // Draw cell borders (medium orange)
        doc
          .strokeColor("#FF6600")
          .lineWidth(1.5)
          .rect(tableX, currentY, col1Width, rowHeight)
          .stroke()
          .rect(tableX + col1Width, currentY, col2Width, rowHeight)
          .stroke();

        // Draw label (black for all rows)
        doc
          .fillColor("#000000")
          .font("Helvetica-Bold")
          .fontSize(10)
          .text(
            row.label,
            tableX + cellPadding,
            currentY + (rowHeight - 10) / 2,
            {
              width: col1Width - 2 * cellPadding,
              align: "left"
            }
          );

        // Draw value (orange bold for donation amount, black for others)
        doc
          .fillColor(isDonationAmount ? "#E69138" : "#000000")
          .font(isDonationAmount || row.valueBold ? "Helvetica-Bold" : "Helvetica")
          .fontSize(10)
          .text(
            row.value || "-",
            tableX + col1Width + cellPadding,
            currentY + (rowHeight - 10) / 2,
            {
              width: col2Width - 2 * cellPadding,
              align: "left",
              lineBreak: true
            }
          );
      });

      y = tableStartY + (tableData.length * rowHeight) + 35;

      doc
        .fillColor("#000000")
        .font("Helvetica")
        .fontSize(8.5)
        .text("Exemption order ref no. AAQTS3485B24PN02", 50, y);

      y += 12;

      doc.text("Valid upto. 2027-28", 50, y);

      // ===== REGD NO CIRCLE (RIGHT SIDE) =====
      y += 15; // Add space below the table text
      const circleX = pageWidth - 105;
      const circleY = y + 5;
      const circleRadius = 46;

      // Draw orange circle border (thin line, matching top image border color)
      doc
        .strokeColor("#E69138")
        .lineWidth(1.5)
        .circle(circleX, circleY, circleRadius)
        .stroke();

      // Add text inside circle (orange color, centered)
      doc
        .fillColor("#E69138")
        .font("Helvetica-Bold")
        .fontSize(10)
        .text("Regd.", circleX - 25, circleY - 10, {
          align: "center",
          width: 50
        });

      doc
        .fontSize(9)
        .text("No. E-594", circleX - 25, circleY + 2, {
          align: "center",
          width: 50
        });

      // ===== FOOTER WITH MORE SPACING =====
      y += 60; // Significant whitespace

      doc
        .fillColor("#333333")
        .font("Times-Italic")
        .fontSize(11)
        .text(
          "Thank you for your generous contribution. May your seva be blessed.",
          50,
          y,
          { align: "center", width: contentWidth }
        );

      y += 20;

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor("#666666")
        .text(
          `Transaction ID : ${donation.paymentId || donation.transactionRef || "N/A"}`,
          50,
          y,
          { align: "center", width: contentWidth }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

exports.getReceiptPublicUrl = getReceiptPublicUrl;