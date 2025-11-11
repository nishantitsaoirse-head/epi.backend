const User = require('../models/User');
const Referral = require('../models/Referral');
const DailyCommission = require('../models/DailyCommission');
const CommissionWithdrawal = require('../models/CommissionWithdrawal');
const { generateReferralCode } = require('../utils/referralUtils');

// Generate and assign referral code to new user
exports.generateReferralCode = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    // First check if the user already has a referral code
    const existingUser = await User.findById(userId);
    
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    // If user already has a valid referral code, return the user
    if (existingUser.referralCode && existingUser.referralCode.length > 0) {
      console.log(`User ${userId} already has referral code: ${existingUser.referralCode}`);
      return existingUser;
    }
    
    // If no code exists, generate a new one
    console.log(`Generating new referral code for user ${userId}`);
    const referralCode = await generateReferralCode();
    
    // Update the user with the new code
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { referralCode },
      { new: true }
    );
    
    return updatedUser;
  } catch (error) {
    console.error('Error in generateReferralCode:', error);
    throw new Error('Error generating referral code: ' + error.message);
  }
};

// Process new referral
exports.processReferral = async (referrerId, referredUserId, installmentDetails) => {
  try {
    const referrer = await User.findById(referrerId);
    const referredUser = await User.findById(referredUserId);

    if (!referrer || !referredUser) {
      throw new Error('User not found');
    }
    
    // Check if this referral already exists
    const existingReferral = await Referral.findOne({
      referrer: referrerId,
      referredUser: referredUserId
    });
    
    if (existingReferral) {
      throw new Error('This referral has already been processed');
    }

    // Extract installment details with defaults
    const { 
      dailyAmount = 100,
      days = 30,
      totalAmount = dailyAmount * days,
      commissionPercentage = 30
    } = installmentDetails || {};

    // Calculate end date based on days
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Create new referral record
    const referral = await Referral.create({
      referrer: referrerId,
      referredUser: referredUserId,
      status: 'ACTIVE',
      startDate,
      endDate,
      dailyAmount,
      days,
      totalAmount,
      commissionPercentage,
      installmentDetails
    });

    // Update referred user's record
    await User.findByIdAndUpdate(referredUserId, {
      referredBy: referrerId
    });

    return referral;
  } catch (error) {
    console.error('Error in processReferral:', error);
    throw new Error('Error processing referral: ' + error.message);
  }
};

// Process daily commission
exports.processDailyCommission = async () => {
  try {
    const activeReferrals = await Referral.find({
      status: 'ACTIVE',
      endDate: { $gt: new Date() }
    });

    for (const referral of activeReferrals) {
      // Check if payment was made for this referral today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // // Check if payment was received from referred user
      // const paymentReceived = await checkPaymentReceived(referral.referredUser, today);
      
      // if (!paymentReceived) {
      //   // Payment not received, extend end date by 1 day
      //   const newEndDate = new Date(referral.endDate);
      //   newEndDate.setDate(newEndDate.getDate() + 1);
        
      //   await Referral.findByIdAndUpdate(
      //     referral._id,
      //     { endDate: newEndDate }
      //   );
        
      //   console.log(`Payment not received for referral ${referral._id}, extended end date by 1 day`);
      //   continue; // Skip commission for this day
      // }
      
      // Calculate daily commission amount based on the referral's settings
      const commissionAmount = (referral.dailyAmount * referral.commissionPercentage) / 100;
      
      // Check if we've already paid commission for today
      const existingCommission = await DailyCommission.findOne({
        referral: referral._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });
      
      if (existingCommission) {
        console.log(`Already processed commission for referral ${referral._id} today`);
        continue;
      }

      // Create daily commission record
      const commission = await DailyCommission.create({
        referral: referral._id,
        referrer: referral.referrer,
        amount: commissionAmount,
        date: new Date(),
        status: 'PENDING'
      });

      // Update referrer's balance (update both wallet.balance and availableBalance for consistency)
      await User.findByIdAndUpdate(referral.referrer, {
        $inc: {
          totalEarnings: commissionAmount,
          availableBalance: commissionAmount,
          'wallet.balance': commissionAmount
        },
        $push: { 'wallet.transactions': {
          type: 'referral_commission',
          amount: commissionAmount,
          description: `Daily commission for referral #${referral._id}`,
          createdAt: new Date()
        }}
      });
      
      // Update commission status to PAID
      await DailyCommission.findByIdAndUpdate(
        commission._id,
        { status: 'PAID' }
      );
      
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
        // This is the last day, mark referral as completed
        await Referral.findByIdAndUpdate(referral._id, {
          status: 'COMPLETED'
        });
        console.log(`Referral ${referral._id} completed after ${updatedReferral.daysPaid} days paid`);
      }
    }
  } catch (error) {
    throw new Error('Error processing daily commission: ' + error.message);
  }
};

// Helper function to check if payment was received for a user on a specific day
async function checkPaymentReceived(userId, date) {
  try {
    // Use the Transaction model to check for successful payments
    const Transaction = require('../models/Transaction');
    
    const payment = await Transaction.findOne({
      user: userId,
      type: 'purchase',
      status: 'completed',
      createdAt: {
        $gte: date,
        $lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    });
    
    return !!payment; // Return true if payment exists, false otherwise
  } catch (error) {
    console.error('Error checking payment:', error);
    return false; // Default to false on error
  }
}

// Request commission withdrawal
exports.requestWithdrawal = async (userId, amount, paymentMethod, paymentDetails) => {
  try {
    const user = await User.findById(userId);

    if (!user || user.wallet?.balance < amount) {
      return {
        success: false,
        message: "Withdrawal request failed: Insufficient balance.",
        withdrawal: {}
      };
    }

    const withdrawal = await CommissionWithdrawal.create({
      user: userId,
      amount,
      paymentMethod,
      paymentDetails
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { 
        availableBalance: -amount,
        'wallet.balance': -amount 
      },
      $push: { 'wallet.transactions': {
        type: 'withdrawal',
        amount: -amount,
        description: `Withdrawal request #${withdrawal._id}`,
        createdAt: new Date()
      }}
    });

    return {
      success: true,
      message: "Withdrawal request submitted successfully.",
      withdrawal: withdrawal
    };

  } catch (error) {
    return {
      success: false,
      message: "Withdrawal request failed: " + error.message,
      withdrawal: {}
    };
  }
};


// Get user's referral statistics
exports.getReferralStats = async (userId) => {
  try {
    const referrals = await Referral.find({ referrer: userId });
    const dailyCommissions = await DailyCommission.find({ referrer: userId });
    const withdrawals = await CommissionWithdrawal.find({ user: userId });

    const totalEarnings = dailyCommissions.reduce((sum, commission) => sum + commission.amount, 0);
    
    // Include both PENDING and COMPLETED withdrawals in the calculation
    const totalWithdrawn = withdrawals
      .filter(w => w.status === 'COMPLETED' || w.status === 'PENDING')
      .reduce((sum, withdrawal) => sum + withdrawal.amount, 0);

    return {
      totalReferrals: referrals.length,
      activeReferrals: referrals.filter(r => r.status === 'ACTIVE').length,
      totalEarnings,
      totalWithdrawn,
      availableBalance: totalEarnings - totalWithdrawn
    };
  } catch (error) {
    throw new Error('Error getting referral stats: ' + error.message);
  }
};

// Update withdrawal status
exports.updateWithdrawalStatus = async (withdrawalId, status, transactionId = null) => {
  try {
    if (!['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(status)) {
      throw new Error('Invalid status value');
    }

    const updates = { 
      status,
      processedAt: status === 'COMPLETED' ? new Date() : null
    };
    
    if (transactionId) {
      updates.transactionId = transactionId;
    }

    const withdrawal = await CommissionWithdrawal.findByIdAndUpdate(
      withdrawalId,
      { $set: updates },
      { new: true }
    );

    if (!withdrawal) {
      throw new Error('Withdrawal not found');
    }

    return withdrawal;
  } catch (error) {
    throw new Error('Error updating withdrawal status: ' + error.message);
  }
};

// Get missed payment days for a referral
exports.getMissedPaymentDays = async (referralId) => {
  try {
    const referral = await Referral.findById(referralId);
    
    if (!referral) {
      throw new Error('Referral not found');
    }
    
    // Calculate days since referral started
    const now = new Date();
    const startDate = new Date(referral.startDate);
    const totalDaysSinceStart = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    
    // Get all successful payment days
    const Transaction = require('../models/Transaction');
    const payments = await Transaction.find({
      user: referral.referredUser,
      type: 'purchase',
      status: 'completed',
      createdAt: { 
        $gte: startDate,
        $lt: now
      }
    }).sort({ createdAt: 1 });
    
    // Number of expected payment days (days passed, but not more than required days)
    const expectedPaymentDays = Math.min(totalDaysSinceStart, referral.days);
    
    // Calculate missed days (expected - actual completed)
    const missedDays = expectedPaymentDays - referral.daysPaid;
    
    // Calculate extended end date (original end date + missed days)
    const originalEndDate = new Date(startDate);
    originalEndDate.setDate(originalEndDate.getDate() + referral.days);
    
    // Current end date from the referral object
    const currentEndDate = referral.endDate;
    
    return {
      referralId: referral._id,
      totalDaysSinceStart,
      expectedPaymentDays,
      actualPaidDays: referral.daysPaid,
      missedDays,
      originalEndDate,
      currentEndDate,
      daysExtended: (currentEndDate - originalEndDate) / (1000 * 60 * 60 * 24)
    };
  } catch (error) {
    throw new Error('Error getting missed payment days: ' + error.message);
  }
}; 