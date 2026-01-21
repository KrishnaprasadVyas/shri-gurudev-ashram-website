const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const admin = await User.findOne({ role: 'system_admin' });
  if (admin) {
    const token = jwt.sign({ id: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '3d' });
    console.log('TOKEN:', token);
  } else {
    console.log('No admin found');
  }
  mongoose.disconnect();
});
