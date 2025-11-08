const mongoose = require('mongoose');

const dailyCommissionSchema = new mongoose.Schema({
  referral: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
    required: true
  },
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID', 'FAILED'],
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying of daily commissions
dailyCommissionSchema.index({ referral: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyCommission', dailyCommissionSchema); 