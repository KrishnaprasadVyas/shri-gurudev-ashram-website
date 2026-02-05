const path = require('path');
const fs = require('fs');
const { generateDonationReceipt } = require('../src/services/receipt.service');

const sampleDonation = {
  _id: Date.now().toString(16),
  createdAt: new Date(),
  amount: 412,

  receiptSeries: "STDOF64984",
  receiptNumber: "42129",

  donor: {
    name: "Krishnaprasad Vyas",
    mobile: "8668308867",
    email: "shriharichaitanyaji@gmail.com",
    address:
      "Swami Harichaitanya Shanti Ashram Trust Buldhana\nMalkapur Road Datala, Malkapur, Buldhana,\nMaharashtra, 443001",
    anonymousDisplay: false,
    idType: "PAN",
    idNumber: "ABCDE1234F",
  },

  donationHead: { name: "General Fund" },

  paymentMode: "Cash",
};

(async () => {
  try {
    console.log('Generating sample receipt for donation id', sampleDonation._id);
    const filePath = await generateDonationReceipt(sampleDonation);
    console.log('✅ Receipt generated at:', filePath);
    
    const receiptsDir = path.join(__dirname, '..', 'receipts');
    if (fs.existsSync(receiptsDir)) {
      const files = fs.readdirSync(receiptsDir);
      console.log('📁 Receipts directory files:', files.length);
    }
  } catch (err) {
    console.error('❌ Error generating sample receipt:', err.message);
    process.exit(1);
  }
})();