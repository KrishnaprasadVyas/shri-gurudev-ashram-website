const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const maskId = require("../utils/maskId");

/**
 * Convert number to words (Indian format)
 */
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertLessThanThousand = (n) => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  let result = '';
  
  if (num >= 10000000) {
    result += convertLessThanThousand(Math.floor(num / 10000000)) + ' Crore ';
    num %= 10000000;
  }
  if (num >= 100000) {
    result += convertLessThanThousand(Math.floor(num / 100000)) + ' Lakh ';
    num %= 100000;
  }
  if (num >= 1000) {
    result += convertLessThanThousand(Math.floor(num / 1000)) + ' Thousand ';
    num %= 1000;
  }
  if (num > 0) {
    result += convertLessThanThousand(num);
  }

  return result.trim();
};

/**
 * Generate donation receipt PDF
 * Professional format matching Swami Harichaitanya Shanti Ashram Trust style
 */
exports.generateDonationReceipt = (donation) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });

      const fileName = `receipt_${donation._id}.pdf`;
      const receiptsDir = path.join(__dirname, "../../receipts");
      
      // Ensure receipts directory exists
      if (!fs.existsSync(receiptsDir)) {
        fs.mkdirSync(receiptsDir, { recursive: true });
      }
      
      const filePath = path.join(receiptsDir, fileName);
      doc.pipe(fs.createWriteStream(filePath));

      // Colors
      const primaryColor = "#D97706"; // Saffron/Orange
      const borderColor = "#D97706";
      const textDark = "#1F2937";
      const textLight = "#6B7280";

      // Page dimensions
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 40;
      const contentWidth = pageWidth - (margin * 2);

      // ==================== OUTER BORDER ====================
      doc.rect(margin - 10, margin - 10, contentWidth + 20, 700)
         .strokeColor(borderColor)
         .lineWidth(2)
         .stroke();

      // ==================== HEADER SECTION ====================
      let yPos = margin;

      // ==================== GURUDEV PHOTO (TOP RIGHT) ====================
      const photoSize = 80;
      const photoX = pageWidth - margin - photoSize;
      const photoY = margin;
      
      // Check if Gurudev photo exists (located in frontend public folder)
      const gurudevPhotoPath = path.join(__dirname, "../../../frontend/public/assets/gurudev.jpg");
      if (fs.existsSync(gurudevPhotoPath)) {
        try {
          // Add photo
          doc.image(gurudevPhotoPath, photoX, photoY, {
            width: photoSize,
            height: photoSize,
            fit: [photoSize, photoSize],
            align: 'center'
          });
          
          // Add circular border around photo
          doc.circle(photoX + photoSize/2, photoY + photoSize/2, photoSize/2)
             .strokeColor(borderColor)
             .lineWidth(2)
             .stroke();
          
          // Add text below photo
          doc.fontSize(7)
             .fillColor(textDark)
             .font("Helvetica")
             .text('Swami Harichaitanyanand', photoX - 10, photoY + photoSize + 5, {
               width: photoSize + 20,
               align: 'center'
             });
          doc.text('Saraswati Ji Maharaj', photoX - 10, photoY + photoSize + 15, {
            width: photoSize + 20,
            align: 'center'
          });
        } catch (err) {
          console.log("Could not load Gurudev photo for receipt");
        }
      }

      // Main Title
      doc.fontSize(22)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("SWAMI HARICHAITANYA SHANTI", margin, yPos + 15, { 
           align: "center",
           width: contentWidth 
         });
      
      doc.fontSize(22)
         .text("ASHRAM TRUST", margin, yPos + 40, { 
           align: "center",
           width: contentWidth 
         });

      // Sub-header addresses
      yPos += 70;
      doc.fontSize(8)
         .fillColor(textDark)
         .font("Helvetica")
         .text("Head Office : Datala, Malkapur, Dist. Buldhana, Maharashtra - 443102 (INDIA)", margin, yPos, {
           align: "center",
           width: contentWidth
         });
      
      doc.text("Branch Office : Palasakhed Sapkal, Chikhali, Dist. Buldhana, Maharashtra 443001", margin, yPos + 12, {
        align: "center",
        width: contentWidth
      });

      doc.text("Mob.:+91 9834151577, 9158740007, 9422881942, 9422884005", margin, yPos + 28, {
        align: "center",
        width: contentWidth
      });

      doc.text("E-mail : sevatirthdham@gmail.com | Website : www.sevatirth.in", margin, yPos + 40, {
        align: "center",
        width: contentWidth
      });

      // DONATION RECEIPT badge
      yPos += 60;
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font("Helvetica-Bold")
         .text("DONATION RECEIPT", margin, yPos, {
           align: "center",
           width: contentWidth
         });

      // ==================== RECEIPT INFO LINE ====================
      yPos += 25;
      
      // Orange line
      doc.moveTo(margin, yPos)
         .lineTo(pageWidth - margin, yPos)
         .strokeColor(primaryColor)
         .lineWidth(2)
         .stroke();

      yPos += 10;

      // Receipt No and Date row
      doc.fontSize(11)
         .fillColor(textDark)
         .font("Helvetica-Bold")
         .text(`Receipt No. : ${donation.receiptNumber || donation._id.toString().slice(-6).toUpperCase()}`, margin + 10, yPos);
      
      const dateStr = new Date(donation.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric"
      });
      doc.text(`Date : ${dateStr}`, pageWidth - margin - 150, yPos);

      // ==================== DONOR DETAILS TABLE ====================
      yPos += 30;

      // Table settings
      const tableLeft = margin;
      const tableWidth = contentWidth;
      const col1Width = 150;
      const col2Width = tableWidth - col1Width;
      const rowHeight = 35;

      const drawTableRow = (label, value, isHighlighted = false) => {
        // Left cell (label)
        doc.rect(tableLeft, yPos, col1Width, rowHeight)
           .strokeColor(borderColor)
           .lineWidth(1)
           .stroke();
        
        doc.fontSize(10)
           .fillColor(textDark)
           .font("Helvetica-Bold")
           .text(label, tableLeft + 10, yPos + 12, {
             width: col1Width - 20
           });

        // Right cell (value)
        if (isHighlighted) {
          doc.rect(tableLeft + col1Width, yPos, col2Width, rowHeight)
             .fillColor("#FEF3C7") // Light yellow/cream
             .fill();
        }
        
        doc.rect(tableLeft + col1Width, yPos, col2Width, rowHeight)
           .strokeColor(borderColor)
           .lineWidth(1)
           .stroke();
        
        doc.fontSize(10)
           .fillColor(isHighlighted ? primaryColor : textDark)
           .font(isHighlighted ? "Helvetica-Bold" : "Helvetica")
           .text(value, tableLeft + col1Width + 10, yPos + 12, {
             width: col2Width - 20
           });

        yPos += rowHeight;
      };

      // Donor Name
      const donorName = donation.donor.anonymousDisplay ? "Anonymous Donor" : donation.donor.name;
      drawTableRow("Donor Name", donorName);

      // Mobile & Email
      const contactInfo = donation.donor.email 
        ? `${donation.donor.mobile}  |  ${donation.donor.email}`
        : donation.donor.mobile;
      drawTableRow("Mobile & Email", contactInfo);

      // Address (taller row)
      const addressRowHeight = 50;
      doc.rect(tableLeft, yPos, col1Width, addressRowHeight)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      doc.fontSize(10)
         .fillColor(textDark)
         .font("Helvetica-Bold")
         .text("Address", tableLeft + 10, yPos + 18);

      doc.rect(tableLeft + col1Width, yPos, col2Width, addressRowHeight)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      doc.fontSize(10)
         .fillColor(textDark)
         .font("Helvetica")
         .text(donation.donor.address || "-", tableLeft + col1Width + 10, yPos + 10, {
           width: col2Width - 20
         });

      yPos += addressRowHeight;

      // PAN/Aadhaar
      const idLabel = donation.donor.idType === "PAN" ? "PAN" : "Aadhaar";
      drawTableRow(idLabel, maskId(donation.donor.idNumber));

      // On Account of (Donation Head)
      drawTableRow("On Account of", donation.donationHead.name || donation.donationHead);

      // Payment Mode
      drawTableRow("Payment Mode", "Online (Razorpay)");

      // Donation Amount (highlighted)
      const amountInWords = numberToWords(donation.amount);
      const amountText = `Rs ${donation.amount.toLocaleString("en-IN")} (${amountInWords} Only)`;
      drawTableRow("Donation Amount", amountText, true);

      // ==================== FOOTER SECTION ====================
      yPos += 20;

      // 80G Exemption info
      doc.fontSize(9)
         .fillColor(textDark)
         .font("Helvetica")
         .text("Exemption order ref no. AAQTS3485B24PN02", margin + 10, yPos);
      
      doc.text("Valid upto. 2027-28", margin + 10, yPos + 14);

      // Trust seal placeholder (circle on right)
      const sealX = pageWidth - margin - 70;
      const sealY = yPos + 5;
      doc.circle(sealX, sealY + 20, 35)
         .strokeColor(primaryColor)
         .lineWidth(1)
         .stroke();
      
      doc.fontSize(6)
         .fillColor(primaryColor)
         .text("Regd.", sealX - 10, sealY + 12);
      doc.text("No. E-594", sealX - 15, sealY + 20);

      // ==================== BOTTOM THANK YOU ====================
      yPos += 70;
      doc.fontSize(10)
         .fillColor(textLight)
         .font("Helvetica-Oblique")
         .text("Thank you for your generous contribution. May your seva be blessed.", margin, yPos, {
           align: "center",
           width: contentWidth
         });

      // Transaction ID (small, at bottom)
      yPos += 25;
      if (donation.paymentId) {
        doc.fontSize(7)
           .fillColor(textLight)
           .font("Helvetica")
           .text(`Transaction ID: ${donation.paymentId}`, margin, yPos, {
             align: "center",
             width: contentWidth
           });
      }

      doc.end();
      resolve(filePath);
    } catch (error) {
      reject(error);
    }
  });
};
