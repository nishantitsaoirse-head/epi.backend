const mongoose = require('mongoose');

const commissionWithdrawalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING'
  },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'UPI', 'BANK'],
    required: true
  },
  paymentDetails: {
    type: Object,
    required: true
  },
  transactionId: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('CommissionWithdrawal', commissionWithdrawalSchema); 