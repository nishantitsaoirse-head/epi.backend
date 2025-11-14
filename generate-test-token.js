// Direct JWT Token Generator for Testing Image Store API
// This bypasses Firebase and directly generates JWT tokens for testing
// Run: node generate-test-token.js

const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

async function generateTestToken() {
  try {
    console.log('🚀 Connecting to MongoDB...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/epi-backend');
    console.log('✅ MongoDB Connected\n');

    // Find or create admin user
    let adminUser = await User.findOne({ role: 'admin' });

    if (!adminUser) {
      console.log('📌 No admin user found. Creating test admin user...');

      adminUser = new User({
        name: 'Test Admin',
        email: 'admin@test.com',
        firebaseUid: 'test-admin-' + Date.now(),
        role: 'admin',
        phoneNumber: '9999999999',
        profilePicture: ''
      });

      await adminUser.save();
      console.log('✅ Test admin user created!\n');
    } else {
      console.log('✅ Admin user found!\n');
    }

    console.log('👤 Admin User Details:');
    console.log('=' .repeat(50));
    console.log(`ID: ${adminUser._id}`);
    console.log(`Name: ${adminUser.name}`);
    console.log(`Email: ${adminUser.email}`);
    console.log(`Role: ${adminUser.role}`);
    console.log('=' .repeat(50));

    // Generate tokens
    const accessToken = generateAccessToken(adminUser._id.toString(), adminUser.role);
    const refreshToken = generateRefreshToken(adminUser._id.toString());

    console.log('\n✅ JWT Tokens Generated!\n');
    console.log('🔐 ACCESS TOKEN (Use this for API calls):');
    console.log('=' .repeat(50));
    console.log(accessToken);
    console.log('=' .repeat(50));

    console.log('\n🔄 REFRESH TOKEN:');
    console.log('=' .repeat(50));
    console.log(refreshToken);
    console.log('=' .repeat(50));

    console.log('\n\n📝 HOW TO USE IN POSTMAN:\n');
    console.log('1. Open Postman');
    console.log('2. Create a new POST request to:');
    console.log('   http://13.203.227.43:5000/api/images\n');
    console.log('3. Go to "Authorization" tab:');
    console.log('   - Type: Bearer Token');
    console.log('   - Token: <paste the ACCESS TOKEN above>\n');
    console.log('4. Go to "Body" tab:');
    console.log('   - Select "form-data"');
    console.log('   - Add these fields:');
    console.log('     • image (File): Select any image file');
    console.log('     • title (Text): "Test Banner"');
    console.log('     • type (Text): "banner"');
    console.log('     • platform (Text): "both"\n');
    console.log('5. Click "Send"\n');

    console.log('✅ Token valid for 7 days!');
    console.log('\n🔗 All Image Store Endpoints:');
    console.log('=' .repeat(50));
    console.log('GET    /api/images/types (No auth)');
    console.log('POST   /api/images (Admin only)');
    console.log('GET    /api/images/admin/all (Admin only)');
    console.log('GET    /api/images/admin/active (Admin only)');
    console.log('GET    /api/images/stats (Admin only)');
    console.log('GET    /api/images/:id (No auth)');
    console.log('GET    /api/images/type/:type (No auth)');
    console.log('PUT    /api/images/:id (Admin only)');
    console.log('DELETE /api/images/:id (Admin only)');
    console.log('=' .repeat(50));

    await mongoose.connection.close();
    console.log('\n✅ Done!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateTestToken();
