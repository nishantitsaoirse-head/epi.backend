const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'purchase', 'refund', 'referral', 'plan_payment'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'bank_transfer', 'upi', 'referral_bonus', 'system', 'card'],
    required: true
  },
  paymentDetails: {
    orderId: String,
    paymentId: String,
    signature: String,
    bankName: String,
    accountNumber: String,
    upiId: String,
    referralCode: String,
    cardNumber: String,
    bank: String
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product'
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan'
  },
  savedPlan: {
    type: Schema.Types.ObjectId,
    ref: 'User.savedPlans'
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

transactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema); 