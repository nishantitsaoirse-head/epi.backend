const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const razorpay = require('../config/razorpay');
const { generateInstallmentOptions } = require('../utils/productUtils');
const mongoose = require('mongoose');

// Create a new order (Book Now functionality)
router.post('/', async (req, res) => {
  try {
    const { 
      productId, 
      paymentOption, 
      paymentDetails,
      deliveryAddress 
    } = req.body;
    
    // Validate input
    if (!productId || !paymentOption) {
      return res.status(400).json({ message: 'Product ID and payment option are required' });
    }
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Validate payment option
    if (!['daily', 'monthly', 'upfront'].includes(paymentOption)) {
      return res.status(400).json({ message: 'Invalid payment option' });
    }
    
    // Create standardized payment details based on payment option
    const standardizedPaymentDetails = { ...paymentDetails, startDate: new Date() };
    
    // For daily payment option, compute required values
    if (paymentOption === 'daily') {
      // Default to 100 INR per day if not specified
      const dailyAmount = paymentDetails?.dailyAmount || 100;
      
      // Calculate number of days needed to complete payment
      const daysNeeded = Math.ceil(product.price / dailyAmount);
      
      // Calculate end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysNeeded);
      
      // Update payment details
      standardizedPaymentDetails.dailyAmount = dailyAmount;
      standardizedPaymentDetails.totalDuration = daysNeeded;
      standardizedPaymentDetails.endDate = endDate;
    }
    
    // Create new order
    const order = new Order({
      user: req.body.userId,
      product: productId,
      orderAmount: product.price,
      paymentOption,
      paymentDetails: standardizedPaymentDetails,
      deliveryAddress
    });
    
    // If upfront payment, handle payment logic immediately
    if (paymentOption === 'upfront') {
      // Check wallet balance
      const user = await User.findById(req.user._id);
      if (user.wallet.balance < product.price) {
        return res.status(400).json({ message: 'Insufficient wallet balance' });
      }
      
      // Create transaction for wallet deduction
      const transaction = new Transaction({
        user: req.user._id,
        type: 'purchase',
        amount: product.price,
        status: 'completed',
        paymentMethod: 'system',
        product: productId,
        description: `Upfront payment for ${product.name}`
      });
      
      await transaction.save();
      
      // Deduct from wallet
      await User.findByIdAndUpdate(req.user._id, {
        $inc: { 'wallet.balance': -product.price },
        $push: { 'wallet.transactions': transaction._id }
      });
      
      // Update order status
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
    }
    
    await order.save();
    
    // For daily payment, generate the first payment order
    if (paymentOption === 'daily') {
      // Create a Razorpay order for the first installment
      const dailyAmount = standardizedPaymentDetails.dailyAmount;
      
      const options = {
        amount: dailyAmount * 100, // Razorpay amount is in paisa
        currency: 'INR',
        receipt: `pay_${Date.now().toString().slice(-8)}_${req.body.userId.toString().slice(-6)}`,
        payment_capture: 1,
        notes: {
          order_id: order._id.toString(),
          payment_type: 'daily_installment_initial',
          product_id: product._id.toString()
        }
      };
      
      // Create Razorpay order
      const razorpayOrder = await razorpay.orders.create(options);
      
      // Create a pending transaction
      const transaction = new Transaction({
        user: req.body.userId,
        type: 'purchase',
        amount: dailyAmount,
        status: 'pending',
        paymentMethod: 'razorpay',
        product: productId,
        paymentDetails: {
          orderId: razorpayOrder.id,
          orderReference: order._id
        },
        description: `Initial daily installment payment for ${product.name}`
      });
      
      await transaction.save();
      
      // Return both order and initial payment info
      res.status(201).json({
        message: 'Order created successfully',
        order,
        payment: {
          order_id: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          transaction_id: transaction._id,
          key_id: process.env.RAZORPAY_KEY_ID
        }
      });
    } else {
      // For non-daily payment options, just return the order
      res.status(201).json({
        message: 'Order created successfully',
        order
      });
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create Razorpay order for payment
router.post('/:id/create-payment', verifyToken, async (req, res) => {
  try {
    const { paymentAmount } = req.body;
    
    if (!paymentAmount || paymentAmount < 1) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Get the order
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Create Razorpay order
    const options = {
      amount: paymentAmount * 100, // Razorpay amount is in paisa
      currency: 'INR',
      receipt: `pay_${Date.now().toString().slice(-8)}_${req.user._id.toString().slice(-6)}`,
      payment_capture: 1
    };
    
    const razorpayOrder = await razorpay.orders.create(options);
    
    // Create a pending transaction
    const transaction = new Transaction({
      user: req.user._id,
      type: 'order_payment',
      amount: paymentAmount,
      status: 'pending',
      paymentMethod: 'razorpay',
      paymentDetails: {
        orderId: razorpayOrder.id,
        orderReference: order._id
      },
      description: `Payment for order #${order._id}`
    });
    
    await transaction.save();
    
    res.status(200).json({
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      transaction_id: transaction._id,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify Razorpay payment for order
router.post('/:id/verify-payment', verifyToken, async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      transaction_id 
    } = req.body;
    
    // Verify the signature - uncomment in production
    // const isValidSignature = razorpay.validateWebhookSignature(
    //   JSON.stringify(req.body), 
    //   razorpay_signature, 
    //   process.env.RAZORPAY_WEBHOOK_SECRET
    // );
    
    // if (!isValidSignature) {
    //   return res.status(400).json({ message: 'Invalid payment signature' });
    // }
    
    // Get the transaction
    const transaction = await Transaction.findById(transaction_id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.paymentDetails.paymentId = razorpay_payment_id;
    transaction.paymentDetails.signature = razorpay_signature;
    await transaction.save();
    
    // Get the order and update its status
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get user info
    const user = await User.findById(req.user._id);
    
    // Update order payment status based on payment option
    if (order.paymentOption === 'upfront') {
      order.paymentStatus = 'completed';
      order.orderStatus = 'confirmed';
    } else {
      // For installment plans, check if this is the first payment or a regular installment
      if (order.paymentStatus === 'pending') {
        order.paymentStatus = 'partial';
        order.orderStatus = 'confirmed';
        
        // Example: For daily payment of Rs. 100 for a Rs. 3000 product (30 days)
        if (order.paymentOption === 'daily') {
          const product = await Product.findById(order.product);
          
          if (!product) {
            return res.status(404).json({ message: 'Product not found' });
          }
          
          // Create saved plan for daily payments
          const savedPlan = {
            product: order.product,
            targetAmount: product.price,
            savedAmount: transaction.amount, // Initial payment (e.g., Rs. 100)
            dailySavingAmount: order.paymentDetails.dailyAmount, // Daily amount (e.g., Rs. 100)
            startDate: new Date(),
            endDate: order.paymentDetails.endDate,
            status: 'active'
          };
          
          // Add the saving plan to user's saved plans
          user.savedPlans.push(savedPlan);
          await user.save();
          
          // Store the saved plan ID in the order for reference
          order.savedPlanId = user.savedPlans[user.savedPlans.length - 1]._id;
        } 
        // For monthly payment option
        else if (order.paymentOption === 'monthly') {
          const product = await Product.findById(order.product);
          
          if (!product) {
            return res.status(404).json({ message: 'Product not found' });
          }
          
          // Calculate equivalent daily amount for monthly payment
          const dailySavingAmount = Math.ceil(order.paymentDetails.monthlyAmount / 30);
          
          // Create saved plan based on order details
          const savedPlan = {
            product: order.product,
            targetAmount: product.price,
            savedAmount: transaction.amount, // Initial payment amount
            dailySavingAmount, // Equivalent daily amount
            startDate: new Date(),
            endDate: order.paymentDetails.endDate,
            status: 'active'
          };
          
          // Add the saving plan to user's saved plans
          user.savedPlans.push(savedPlan);
          await user.save();
          
          // Store the saved plan ID in the order for reference
          order.savedPlanId = user.savedPlans[user.savedPlans.length - 1]._id;
        }
      }
      
      // Logic for installment tracking could be added here
    }
    
    await order.save();
    
    res.status(200).json({
      message: 'Payment successful',
      order,
      transaction,
      savedPlan: order.paymentOption !== 'upfront' ? 
        user.savedPlans[user.savedPlans.length - 1] : null
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
// Get orders with pagination, search, and payment details
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      status,
      paymentStatus,
      startDate,
      endDate,
      searchTerm
    } = req.query;

    // Build query
    const query = {};
    
    // Filter by order status if provided
    if (status) {
      query.orderStatus = status;
    }
    
    // Filter by payment status if provided
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // Filter by date range if provided
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.createdAt = { $lte: new Date(endDate) };
    }

    // Search functionality for order ID (if MongoDB's ObjectId is used as string)
    if (searchTerm) {
      // If searchTerm is a valid ObjectId, search by _id
      const isValidObjectId = mongoose.Types.ObjectId.isValid(searchTerm);
      
      if (isValidObjectId) {
        query._id = mongoose.Types.ObjectId(searchTerm);
      }
    }

    // Prepare sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate pagination values
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // First get all orders with pagination
    const orderResults = await Order.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      {
        $unwind: '$userData'
      },
      {
        $unwind: '$productData'
      },
      {
        $match: {
          ...query,
          $or: searchTerm && !mongoose.Types.ObjectId.isValid(searchTerm) ? [
            { 'userData.name': { $regex: searchTerm, $options: 'i' } },
            { 'userData.email': { $regex: searchTerm, $options: 'i' } },
            { 'productData.name': { $regex: searchTerm, $options: 'i' } }
          ] : [{}]
        }
      },
      {
        $project: {
          _id: 1,
          user: {
            _id: '$userData._id',
            name: '$userData.name',
            email: '$userData.email'
          },
          product: {
            _id: '$productData._id',
            name: '$productData.name',
            price: '$productData.price',
            image: { $arrayElemAt: ['$productData.images', 0] }
          },
          orderAmount: 1,
          paymentOption: 1,
          paymentDetails: 1,
          orderStatus: 1,
          paymentStatus: 1,
          deliveryAddress: 1,
          deliveryStatus: 1,
          createdAt: 1,
          updatedAt: 1
        }
      },
      {
        $sort: sortOptions
      },
      {
        $skip: skip
      },
      {
        $limit: limitNum
      }
    ]);

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(query);

    // Now fetch transactions for each order
    const ordersWithTransactions = await Promise.all(
      orderResults.map(async (order) => {
        // Get transactions for this order's user and product
        const transactions = await Transaction.find({
          user: order.user._id,
          product: order.product._id,
          type: 'purchase' // Based on your sample transaction type
        }).sort({ createdAt: -1 }); // Sort by newest first

        return {
          ...order,
          transactions: transactions.map(t => ({
            _id: t._id,
            type: t.type,
            amount: t.amount,
            status: t.status,
            paymentMethod: t.paymentMethod,
            paymentDetails: t.paymentDetails,
            description: t.description,
            createdAt: t.createdAt
          }))
        };
      })
    );

    res.status(200).json({
      success: true,
      count: ordersWithTransactions.length,
      totalPages: Math.ceil(totalOrders / limitNum),
      currentPage: pageNum,
      totalOrders,
      data: ordersWithTransactions
    });
  } catch (error) {
    console.error('Error fetching orders with transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get order by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('product');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel order
router.put('/:id/cancel', verifyToken, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ 
        message: `Cannot cancel order in ${order.orderStatus} status`
      });
    }
    
    order.orderStatus = 'cancelled';
    await order.save();
    
    res.status(200).json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 