const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Product = require('../models/Product');
const razorpay = require('../config/razorpay');

// Get wallet balance and transactions
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('wallet')
      .populate({
        path: 'wallet.transactions',
        options: { sort: { createdAt: -1 } }
      });
    
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.status(200).json({
      balance: user.wallet.balance,
      transactions
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add money to wallet using Razorpay
router.post('/add-money', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const options = {
      amount: amount * 100, // Razorpay amount is in paisa
      currency: 'INR',
      receipt: `receipt_${Date.now()}_${req.user._id}`,
      payment_capture: 1
    };
    
    const order = await razorpay.orders.create(options);
    
    // Create a pending transaction
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount,
      status: 'pending',
      paymentMethod: 'razorpay',
      paymentDetails: {
        orderId: order.id
      },
      description: 'Add money to wallet'
    });
    
    await transaction.save();
    
    // Update user's wallet transactions
    await User.findByIdAndUpdate(req.user._id, {
      $push: { 'wallet.transactions': transaction._id }
    });
    
    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      transaction_id: transaction._id
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Razorpay payment
router.post('/verify-payment', verifyToken, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transaction_id } = req.body;
    
    // Verify the signature
    // In a real implementation, we would validate the signature here
    
    // Update the transaction status
    const transaction = await Transaction.findByIdAndUpdate(
      transaction_id,
      {
        $set: {
          status: 'completed',
          'paymentDetails.paymentId': razorpay_payment_id,
          'paymentDetails.signature': razorpay_signature
        }
      },
      { new: true }
    );
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Add the amount to user's wallet
    await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { 'wallet.balance': transaction.amount } }
    );
    
    res.status(200).json({
      message: 'Payment successful',
      transaction
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a saving plan for a product
router.post('/create-saving-plan', verifyToken, async (req, res) => {
  try {
    const { productId, dailySavingAmount } = req.body;
    
    if (!productId || !dailySavingAmount || dailySavingAmount < 1) {
      return res.status(400).json({ message: 'Invalid request data' });
    }
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Calculate days required based on daily saving amount
    const daysRequired = Math.ceil(product.price / dailySavingAmount);
    
    if (daysRequired < product.minimumSavingDays) {
      return res.status(400).json({ 
        message: `Minimum saving period is ${product.minimumSavingDays} days. Please adjust your daily amount.` 
      });
    }
    
    // Create end date based on days required
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + daysRequired);
    
    const savingPlan = {
      product: productId,
      targetAmount: product.price,
      savedAmount: 0,
      dailySavingAmount,
      startDate: new Date(),
      endDate,
      status: 'active'
    };
    
    // Add the saving plan to user's saved plans
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $push: { savedPlans: savingPlan } },
      { new: true }
    ).populate('savedPlans.product');
    
    const newPlan = updatedUser.savedPlans[updatedUser.savedPlans.length - 1];
    
    res.status(201).json({
      message: 'Saving plan created successfully',
      plan: newPlan
    });
  } catch (error) {
    console.error('Error creating saving plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add daily savings to a plan
router.post('/add-to-saving/:planId', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const planId = req.params.planId;
    
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Get user and check wallet balance
    const user = await User.findById(req.user._id);
    
    if (user.wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }
    
    // Find the saving plan
    const savingPlan = user.savedPlans.id(planId);
    
    if (!savingPlan) {
      return res.status(404).json({ message: 'Saving plan not found' });
    }
    
    if (savingPlan.status !== 'active') {
      return res.status(400).json({ message: `Cannot add to a ${savingPlan.status} plan` });
    }
    
    // Check if adding this amount would exceed the target
    const newSavedAmount = savingPlan.savedAmount + amount;
    if (newSavedAmount > savingPlan.targetAmount) {
      return res.status(400).json({ 
        message: `Amount exceeds target. You can add maximum ${savingPlan.targetAmount - savingPlan.savedAmount}` 
      });
    }
    
    // Update the saved amount
    savingPlan.savedAmount = newSavedAmount;
    
    // Check if target is reached
    if (newSavedAmount === savingPlan.targetAmount) {
      savingPlan.status = 'completed';
    }
    
    // Deduct from wallet balance
    user.wallet.balance -= amount;
    
    await user.save();
    
    // Create a transaction record
    const transaction = new Transaction({
      user: req.user._id,
      type: 'deposit',
      amount,
      status: 'completed',
      paymentMethod: 'system',
      savedPlan: planId,
      description: 'Add to saving plan'
    });
    
    await transaction.save();
    
    // Add transaction to user's wallet transactions
    await User.findByIdAndUpdate(req.user._id, {
      $push: { 'wallet.transactions': transaction._id }
    });
    
    res.status(200).json({
      message: 'Amount added to saving plan successfully',
      plan: savingPlan,
      walletBalance: user.wallet.balance
    });
  } catch (error) {
    console.error('Error adding to saving plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all saving plans
router.get('/saving-plans', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('savedPlans')
      .populate('savedPlans.product');
    
    res.status(200).json(user.savedPlans);
  } catch (error) {
    console.error('Error fetching saving plans:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific saving plan
router.get('/saving-plans/:planId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedPlans.product');
    
    const plan = user.savedPlans.id(req.params.planId);
    
    if (!plan) {
      return res.status(404).json({ message: 'Saving plan not found' });
    }
    
    res.status(200).json(plan);
  } catch (error) {
    console.error('Error fetching saving plan:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Public endpoint to check wallet balance (for testing)
router.get('/balance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const user = await User.findById(userId).select('name wallet totalEarnings availableBalance');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      name: user.name,
      walletBalance: user.wallet?.balance || 0,
      availableBalance: user.availableBalance || 0,
      totalEarnings: user.totalEarnings || 0,
      transactionCount: user.wallet?.transactions?.length || 0
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 