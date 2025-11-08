require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-project')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Admin user data - use the Firebase UID of your admin user
const adminData = {
  name: 'Admin User',
  email: 'admin@example.com',
  firebaseUid: 'REPLACE_WITH_FIREBASE_USER_UID', // Replace with the UID from Firebase Auth
  role: 'admin', // This is important to set the user as admin
  profilePicture: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
};

async function createAdminUser() {
  try {
    // Check if user with this Firebase UID already exists
    let user = await User.findOne({ firebaseUid: adminData.firebaseUid });
    
    if (user) {
      // Update the user to be an admin if not already
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`User ${user.email} updated to admin role.`);
      } else {
        console.log(`User ${user.email} is already an admin.`);
      }
    } else {
      // Create new admin user
      user = new User(adminData);
      await user.save();
      console.log(`Admin user ${adminData.email} created successfully.`);
    }
    
    // Display user info
    console.log('Admin User Details:');
    console.log(JSON.stringify({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      firebaseUid: user.firebaseUid
    }, null, 2));
    
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

createAdminUser(); 