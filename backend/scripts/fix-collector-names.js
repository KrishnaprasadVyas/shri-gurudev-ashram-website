/**
 * Fix collector names - ensure all users with referral codes have fullName
 * Run: node scripts/fix-collector-names.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function fixCollectorNames() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  // Find all users with referral codes
  const users = await User.find({ 
    referralCode: { $exists: true, $ne: null, $ne: '' } 
  }).select('fullName referralCode mobile email');

  console.log(`Found ${users.length} users with referral codes:\n`);

  let fixed = 0;
  for (const user of users) {
    const hasName = user.fullName && user.fullName.trim();
    console.log(`  ${user.referralCode} | ${hasName ? user.fullName : '❌ NO NAME'} | ${user.mobile || user.email || 'no contact'}`);
    
    if (!hasName) {
      // Generate a name from mobile or set default
      const generatedName = user.mobile 
        ? `Collector ${user.mobile.slice(-4)}`
        : `Collector ${user.referralCode}`;
      
      await User.findByIdAndUpdate(user._id, { fullName: generatedName });
      console.log(`    ✅ Fixed: Set fullName to "${generatedName}"`);
      fixed++;
    }
  }

  console.log(`\n✅ Done! Fixed ${fixed} users without names.`);
  process.exit(0);
}

fixCollectorNames().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
