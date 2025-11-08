/**
 * API Test Script for Missed Payment Flow
 * 
 * This script tests the API endpoints related to missed payments and end date extension
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const USER_ID = process.env.TEST_USER_ID || ''; // Replace with actual test user ID
const REFERRAL_ID = process.env.TEST_REFERRAL_ID || ''; // Replace with actual test referral ID

// Check for required parameters
if (!USER_ID) {
  console.error('Error: TEST_USER_ID is required. Set it in the environment or hardcode it in this script.');
  process.exit(1);
}

if (!REFERRAL_ID) {
  console.error('Error: TEST_REFERRAL_ID is required. Set it in the environment or hardcode it in this script.');
  process.exit(1);
}

// Helper function to make API calls
async function callApi(method, endpoint, data = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`${method.toUpperCase()} ${url}`);
    
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Main test function
async function runTest() {
  try {
    console.log('Starting API test for missed payment flow...\n');
    
    // 1. Get referral details
    console.log('1. Getting referral details...');
    const referralDetails = await callApi('get', `/referrals/details/${REFERRAL_ID}`);
    console.log('Referral details:', JSON.stringify(referralDetails.referral, null, 2));
    console.log('\n');
    
    // 2. Get missed payment details
    console.log('2. Getting missed payment details...');
    const missedPayments = await callApi('get', `/referrals/missed-payments/${REFERRAL_ID}`);
    console.log('Missed payment details:', JSON.stringify(missedPayments.missedPaymentDetails, null, 2));
    console.log('\n');
    
    // 3. Get user's transactions
    console.log('3. Getting user transactions...');
    const transactions = await callApi('get', `/referrals/transactions?userId=${USER_ID}`);
    console.log(`Found ${transactions.transactions.length} transactions`);
    console.log('Latest transactions:', JSON.stringify(transactions.transactions.slice(0, 3), null, 2));
    console.log('\n');
    
    // 4. Trigger daily commission processing (admin only)
    console.log('4. Triggering daily commission processing...');
    try {
      const processingResult = await callApi('post', '/referrals/process-daily-commissions');
      console.log('Processing result:', processingResult);
    } catch (error) {
      console.log('Note: This endpoint might be admin-only and require authentication');
    }
    console.log('\n');
    
    // 5. Check referral details again to see changes
    console.log('5. Getting updated referral details...');
    const updatedReferral = await callApi('get', `/referrals/details/${REFERRAL_ID}`);
    console.log('Updated referral details:', JSON.stringify(updatedReferral.referral, null, 2));
    console.log('\n');
    
    // 6. Get updated missed payment details
    console.log('6. Getting updated missed payment details...');
    const updatedMissedPayments = await callApi('get', `/referrals/missed-payments/${REFERRAL_ID}`);
    console.log('Updated missed payment details:', JSON.stringify(updatedMissedPayments.missedPaymentDetails, null, 2));
    
    console.log('\nTest completed successfully.');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest(); 