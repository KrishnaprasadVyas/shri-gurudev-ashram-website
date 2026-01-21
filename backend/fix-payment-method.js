const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  
  const Donation = require('./src/models/Donation');
  
  // Fix donations without paymentMethod (undefined)
  const result1 = await Donation.updateMany(
    { paymentMethod: { $exists: false } },
    { $set: { paymentMethod: 'ONLINE' } }
  );
  console.log('Updated donations without paymentMethod:', result1.modifiedCount);
  
  // Fix donations with null paymentMethod
  const result2 = await Donation.updateMany(
    { paymentMethod: null },
    { $set: { paymentMethod: 'ONLINE' } }
  );
  console.log('Updated donations with null paymentMethod:', result2.modifiedCount);
  
  // Verify the fix
  const donations = await Donation.find({ status: 'SUCCESS' }).select('paymentMethod amount donor.name').lean();
  console.log('\nVerification - All successful donations:');
  donations.forEach(d => console.log('Name:', d.donor?.name, '| Method:', d.paymentMethod, '| Amount:', d.amount));
  
  mongoose.disconnect();
  console.log('\nDone!');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
