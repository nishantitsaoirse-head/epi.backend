// Test script to get Firebase ID token for API testing
// Run: node test-firebase-login.js

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json');

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('\n📌 Make sure:');
    console.log('1. firebase-service-account.json exists in the project root');
    console.log('2. OR set FIREBASE_SERVICE_ACCOUNT_PATH in .env file');
    process.exit(1);
  }
}

async function getCustomToken(email) {
  try {
    console.log(`\n🔍 Looking for user: ${email}`);

    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid}`);

    // Generate custom token
    const customToken = await admin.auth().createCustomToken(user.uid);
    console.log('\n✅ Custom Token Generated!\n');
    console.log('🔐 Use this token to get ID token:\n');
    console.log(customToken);
    console.log('\n');
    console.log('📝 Now exchange this custom token for ID token using:');
    console.log('POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=YOUR_FIREBASE_API_KEY');
    console.log('\nBody: { "token": "' + customToken + '", "returnSecureToken": true }');
    console.log('\nThe response will contain "idToken" which you can use for API testing.');

    return customToken;
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.code === 'auth/user-not-found') {
      console.log('\n📌 User not found! Creating new user...');

      try {
        const newUser = await admin.auth().createUser({
          email: email,
          password: 'Test@123', // Change this password
          displayName: 'Test Admin'
        });

        console.log(`✅ User created: ${newUser.uid}`);

        // Set custom claims for admin role
        await admin.auth().setCustomUserClaims(newUser.uid, { admin: true });
        console.log('✅ Admin role assigned');

        // Generate token for new user
        const customToken = await admin.auth().createCustomToken(newUser.uid);
        console.log('\n✅ Custom Token Generated!\n');
        console.log(customToken);

        return customToken;
      } catch (createError) {
        console.error('❌ Error creating user:', createError.message);
      }
    }
  }
}

// Usage
const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@test.com';
console.log('🚀 Firebase Token Generator for API Testing');
console.log('=' .repeat(50));

getCustomToken(testEmail);
