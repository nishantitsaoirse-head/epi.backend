/**
 * Script to update all products with new installment options starting from 100 rupees
 * This will replace all existing installment options with new ones based on minimum 100 rupees/day
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { generateInstallmentOptions } = require('../utils/productUtils');

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-project')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function updateAllInstallmentAmounts() {
  try {
    console.log('Finding all products...');
    
    // Find all products
    const products = await Product.find({});
    
    console.log(`Found ${products.length} products total`);
    
    // Update each product
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const product of products) {
      if (!product.price) {
        console.log(`Skipping product ${product._id} - no price defined`);
        skippedCount++;
        continue;
      }
      
      console.log(`Processing product: ${product._id}, name: ${product.name}, price: ${product.price}`);
      
      // Generate new installment options with 100 rupees as minimum
      const installmentOptions = generateInstallmentOptions(product.price);
      
      // Update the product
      await Product.findByIdAndUpdate(
        product._id,
        { installmentOptions },
        { new: true }
      );
      
      updatedCount++;
      console.log(`- Updated product ${product._id} with new installment options starting from 100 rupees/day`);
    }
    
    console.log('Update complete!');
    console.log(`Updated ${updatedCount} products and skipped ${skippedCount} products out of ${products.length} total`);
    
    return { 
      success: true, 
      updated: updatedCount, 
      skipped: skippedCount,
      total: products.length 
    };
  } catch (error) {
    console.error('Error updating products:', error);
    return { success: false, error: error.message };
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Execute the update function
updateAllInstallmentAmounts()
  .then(result => {
    console.log('Script execution completed');
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 