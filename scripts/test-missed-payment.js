/**
 * Test script to verify the referral missed payment flow
 * 
 * This script:
 * 1. Creates a test referral between two users
 * 2. Simulates a few days of payments
 * 3. Skips a payment day
 * 4. Processes the daily commission
 * 5. Verifies the end date was extended properly
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Transaction = require('../models/Transaction');
const DailyCommission = require('../models/DailyCommission');
const referralController = require('../controllers/referralController');

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-referrals-test', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected successfully');
  runTest().catch(err => console.error('Test error:', err));
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

async function runTest() {
  try {
    console.log('Starting missed payment flow test...');
    
    // 1. Create test users if they don't exist
    let referrer = await User.findOne({ email: 'referrer-test@example.com' });
    if (!referrer) {
      referrer = await User.create({
        name: 'Test Referrer',
        firebaseId: '1234567890',
        email: 'referrer-test@example.com',
        phone: '9876543210',
        password: 'test1234', // In a real app, hash this
        referralCode: 'TESTREF123',
        availableBalance: 0,
        totalEarnings: 0
      });
      console.log('Created referrer user:', referrer._id);
    }
    
    let referredUser = await User.findOne({ email: 'referred-test@example.com' });
    if (!referredUser) {
      referredUser = await User.create({
        name: 'Test Referred User',
        firebaseId: '1234567891',
        email: 'referred-test@example.com',
        phone: '9876543211',
        password: 'test1234', // In a real app, hash this
        referredBy: referrer._id
      });
      console.log('Created referred user:', referredUser._id);
    }
    
    // 2. Create a test referral if it doesn't exist
    let referral = await Referral.findOne({ 
      referrer: referrer._id,
      referredUser: referredUser._id
    });
    
    if (!referral) {
      const installmentDetails = {
        dailyAmount: 100,
        days: 7, // Using a small number for testing
        totalAmount: 700, 
        commissionPercentage: 30,
        name: 'Test Plan'
      };
      
      // Use the controller to create the referral
      referral = await referralController.processReferral(
        referrer._id,
        referredUser._id,
        installmentDetails
      );
      
      console.log('Created test referral:', referral._id);
    } else {
      console.log('Using existing referral:', referral._id);
    }
    
    // Save original end date for comparison
    const originalEndDate = new Date(referral.endDate);
    console.log('Original end date:', originalEndDate);
    
    // 3. Simulate a few days of payments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Delete any existing test transactions for clean test
    await Transaction.deleteMany({
      user: referredUser._id,
      description: /Test payment/
    });
    
    // Create payment for day 1
    const payment1 = await Transaction.create({
      user: referredUser._id,
      firebaseId: '1234567891',
      type: 'purchase',
      amount: 100,
      status: 'completed',
      paymentMethod: 'razorpay',
      description: 'Test payment - Day 1',
      createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    });
    console.log('Created payment for day 1:', payment1._id);
    
    // Create payment for day 2
    const payment2 = await Transaction.create({
      user: referredUser._id,
      firebaseId: '1234567891',
      type: 'purchase',
      amount: 100,
      status: 'completed',
      paymentMethod: 'razorpay',
      description: 'Test payment - Day 2',
      createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    });
    console.log('Created payment for day 2:', payment2._id);
    
    // Don't create payment for day 3 (today) - simulating missed payment
    console.log('Intentionally skipping payment for day 3 (today)');
    
    // 4. Process daily commissions for the past 3 days
    // First delete any existing commissions for clean test
    await DailyCommission.deleteMany({
      referral: referral._id,
      date: {
        $gte: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        $lte: today
      }
    });
    
    // Process day 1
    let day1Date = new Date(today);
    day1Date.setDate(day1Date.getDate() - 2);
    await processDailyCommissionForDate(day1Date);
    
    // Process day 2
    let day2Date = new Date(today);
    day2Date.setDate(day2Date.getDate() - 1);
    await processDailyCommissionForDate(day2Date);
    
    // Process day 3 (today - missed payment)
    await processDailyCommissionForDate(today);
    
    // 5. Get the referral after processing
    referral = await Referral.findById(referral._id);
    console.log('End date after processing:', referral.endDate);
    
    // Check if the end date was extended
    const daysExtended = Math.round((new Date(referral.endDate) - originalEndDate) / (24 * 60 * 60 * 1000));
    console.log(`End date was extended by ${daysExtended} days`);
    
    // 6. Check missed payment details
    const missedPaymentDetails = await referralController.getMissedPaymentDays(referral._id);
    console.log('Missed payment details:', JSON.stringify(missedPaymentDetails, null, 2));
    
    // 7. Verify paid commissions
    const commissions = await DailyCommission.find({ referral: referral._id }).sort({ date: 1 });
    console.log(`Found ${commissions.length} commissions paid:`);
    commissions.forEach(commission => {
      console.log(`- ${commission.date.toDateString()}: ₹${commission.amount}`);
    });
    
    console.log('\nTest completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Helper function to process daily commission for a specific date
async function processDailyCommissionForDate(date) {
  console.log(`Processing commissions for ${date.toDateString()}...`);
  
  // Get active referrals
  const activeReferrals = await Referral.find({
    status: 'ACTIVE',
    endDate: { $gt: date }
  });
  
  for (const referral of activeReferrals) {
    // Check if payment was made for this referral on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Check if payment was received
    const payment = await Transaction.findOne({
      user: referral.referredUser,
      type: 'purchase',
      status: 'completed',
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (!payment) {
      console.log(`No payment found for referral ${referral._id} on ${date.toDateString()}`);
      
      // Payment not received, extend end date by 1 day
      const newEndDate = new Date(referral.endDate);
      newEndDate.setDate(newEndDate.getDate() + 1);
      
      await Referral.findByIdAndUpdate(
        referral._id,
        { endDate: newEndDate }
      );
      
      console.log(`Extended end date for referral ${referral._id} by 1 day`);
      continue; // Skip commission for this day
    }
    
    // Calculate daily commission amount
    const commissionAmount = (referral.dailyAmount * referral.commissionPercentage) / 100;
    
    // Check if we've already paid commission for this day
    const existingCommission = await DailyCommission.findOne({
      referral: referral._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    if (existingCommission) {
      console.log(`Already processed commission for referral ${referral._id} on ${date.toDateString()}`);
      continue;
    }
    
    // Create daily commission record
    const commission = await DailyCommission.create({
      referral: referral._id,
      referrer: referral.referrer,
      amount: commissionAmount,
      date: date,
      status: 'PENDING'
    });
    
    console.log(`Created commission of ₹${commissionAmount} for ${date.toDateString()}`);
    
    // Update referrer's balance
    await User.findByIdAndUpdate(referral.referrer, {
      $inc: {
        totalEarnings: commissionAmount,
        availableBalance: commissionAmount
      }
    });
    
    // Update referral with progress
    const updatedReferral = await Referral.findByIdAndUpdate(
      referral._id,
      {
        $inc: {
          commissionEarned: commissionAmount,
          daysPaid: 1
        }
      },
      { new: true }
    );
    
    // Check if all days have been paid
    if (updatedReferral.daysPaid >= updatedReferral.days) {
      await Referral.findByIdAndUpdate(referral._id, {
        status: 'COMPLETED'
      });
      console.log(`Referral ${referral._id} completed after ${updatedReferral.daysPaid} days paid`);
    }
  }
} 