/**
 * Script to fix all products with missing or incorrect installmentOptions
 * This will regenerate installment options for ALL products in the database
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

async function fixAllProductInstallments() {
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
      
      // Check if installmentOptions is valid
      let needsUpdate = false;
      
      if (!product.installmentOptions || product.installmentOptions.length === 0) {
        console.log(`- Product has empty installmentOptions`);
        needsUpdate = true;
      } else {
        console.log(`- Current installmentOptions length: ${product.installmentOptions.length}`);
        
        // Check if any installment option is invalid or missing critical fields
        const hasInvalid = product.installmentOptions.some(option => {
          return !option.amount || !option.period || !option.periodUnit || !option.totalAmount || 
                 option.totalAmount === 0 || !option.startDate || !option.endDate || 
                 !option.lastPaymentAmount;
        });
        
        if (hasInvalid) {
          console.log(`- Product has invalid installmentOptions`);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        console.log(`- Generating new installmentOptions for product ${product._id}`);
        
        // Generate new installment options
        const installmentOptions = generateInstallmentOptions(product.price);
        
        // Update the product
        await Product.findByIdAndUpdate(
          product._id,
          { installmentOptions },
          { new: true }
        );
        
        updatedCount++;
        console.log(`- Updated product ${product._id} with new installment options`);
      } else {
        console.log(`- Product ${product._id} has valid installmentOptions, skipping`);
        skippedCount++;
      }
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
fixAllProductInstallments()
  .then(result => {
    console.log('Script execution completed');
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 