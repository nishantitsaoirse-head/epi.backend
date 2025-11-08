const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { generateInstallmentOptions } = require('../utils/productUtils');

const productSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  originalPrice: {
    type: Number
  },
  brand: {
    type: String
  },
  model: {
    type: String
  },
  features: [{ 
    type: String 
  }],
  specifications: {
    type: Map,
    of: String
  },
  rating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  likePercentage: {
    type: Number,
    default: 0
  },
  images: [{
    type: String
  }],
  category: {
    type: String,
    required: true
  },
  isCombo: {
    type: Boolean,
    default: false
  },
  isSpecialPrice: {
    type: Boolean,
    default: false
  },
  comboProducts: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      default: 1
    }
  }],
  stock: {
    type: Number,
    default: 0
  },
  minimumSavingDays: {
    type: Number,
    default: 30
  },
  suggestedDailySavingAmount: {
    type: Number
  },
  installmentOptions: [{
    amount: Number,
    period: String,
    periodUnit: String,
    totalAmount: Number,
    lastPaymentAmount: Number,
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isRecommended: {
      type: Boolean,
      default: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
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

// Calculate suggestedDailySavingAmount and installmentOptions before saving
productSchema.pre('save', function(next) {
  console.log('Pre-save hook triggered');
  console.log('Price:', this.price);
  console.log('Current installmentOptions:', this.installmentOptions);
  
  if (this.price && this.minimumSavingDays) {
    this.suggestedDailySavingAmount = Math.ceil(this.price / this.minimumSavingDays);
    console.log('Calculated suggestedDailySavingAmount:', this.suggestedDailySavingAmount);
  }
  
  // Auto-generate installmentOptions if not provided and price exists
  if (this.price && (!this.installmentOptions || this.installmentOptions.length === 0)) {
    console.log('Generating installmentOptions for price:', this.price);
    this.installmentOptions = generateInstallmentOptions(this.price);
    console.log('Generated installmentOptions:', this.installmentOptions);
  }
  
  this.updatedAt = Date.now();
  next();
});

// Add a pre-update middleware to ensure installmentOptions are generated when product is updated
productSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const price = update.price || update.$set?.price;
  
  if (price) {
    // If price is being updated, regenerate installmentOptions
    if (!update.installmentOptions && !update.$set?.installmentOptions) {
      const options = generateInstallmentOptions(price);
      
      if (!update.$set) {
        update.$set = {};
      }
      
      update.$set.installmentOptions = options;
    }
  }
  
  next();
});

module.exports = mongoose.model('Product', productSchema); 