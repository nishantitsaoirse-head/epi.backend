const mongoose = require('mongoose');

const cartProductSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  products: [cartProductSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);
