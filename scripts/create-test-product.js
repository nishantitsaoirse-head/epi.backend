const mongoose = require('mongoose');
const Product = require('../models/Product');

mongoose.connect('mongodb://localhost:27017/epi-project', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    const testProduct = new Product({
      productId: 'TEST001',
      name: 'Test Product',
      brand: 'Test Brand',
      description: {
        short: 'Test product for cart/wishlist',
        long: 'This is a test product for cart/wishlist testing'
      },
      price: 999,
      images: [{
        url: 'https://via.placeholder.com/150',
        alt: 'Test Product Image'
      }],
      category: {
        main: 'test',
        sub: 'testing'
      }
    });

    await testProduct.save();
    console.log('Test product created with ID:', testProduct._id);
    console.log('Use this ID for testing cart/wishlist operations');
  } catch (error) {
    console.error('Error creating test product:', error);
  } finally {
    mongoose.connection.close();
  }
})
.catch(err => console.error('MongoDB connection error:', err));