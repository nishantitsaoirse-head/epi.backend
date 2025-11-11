const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const planSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  completedAmount: {
    type: Number,
    default: 0
  },
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    lastPaymentDate: {
      type: Date,
      default: Date.now
    },
    dailyPayment: {
      type: Number,
      required: true
    },
    totalProductAmount: {
      type: Number,
      required: true
    },
    paidAmount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'completed'],
      default: 'pending'
    },
    isActive: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    deliveryAddress: {
      type: Object
    },
    paymentMethod: {
      type: String,
      default: 'card'
    },
    cardDetails: {
      bank: String,
      cardType: String,
      last4Digits: String
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate correct totals and update timestamps
planSchema.pre('save', function(next) {
  // Only recalculate if there are products
  if (this.products && this.products.length > 0) {
    let totalAmount = 0;
    let completedAmount = 0;
    
    // Calculate based on products in the plan
    for (const product of this.products) {
      totalAmount += product.totalProductAmount || 0;
      completedAmount += product.paidAmount || 0;
    }
    
    // Set the calculated values
    this.totalAmount = totalAmount;
    this.completedAmount = completedAmount;
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Plan', planSchema); 