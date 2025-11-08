/**
 * Script to convert all installment options to use days as the period unit
 * This will update all products to ensure all installment options use "days" instead of "months"
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

async function convertAllInstallmentsToDaily() {
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
      
      if (!product.installmentOptions || product.installmentOptions.length === 0) {
        console.log(`- Product has no installmentOptions, generating new ones`);
        
        // Generate new installment options (all using days)
        const installmentOptions = generateInstallmentOptions(product.price);
        
        // Update the product
        await Product.findByIdAndUpdate(
          product._id,
          { installmentOptions },
          { new: true }
        );
        
        updatedCount++;
        console.log(`- Updated product ${product._id} with new installment options`);
        continue;
      }
      
      // Check if any options use "months" instead of "days"
      const hasMonthly = product.installmentOptions.some(option => 
        option.periodUnit === 'months'
      );
      
      if (hasMonthly) {
        console.log(`- Product has installment options with "months" unit, converting to days`);
        
        // Convert existing installment options to use days
        const convertedOptions = product.installmentOptions.map(option => {
          if (option.periodUnit === 'months') {
            const periodInDays = parseInt(option.period) * 30; // Convert months to days (approximate)
            const dailyAmount = Math.ceil(option.totalAmount / periodInDays);
            const lastDayAmount = option.totalAmount - (dailyAmount * (periodInDays - 1));
            
            const startDate = new Date(option.startDate || new Date());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + periodInDays);
            
            return {
              ...option.toObject(),
              amount: dailyAmount,
              period: periodInDays.toString(),
              periodUnit: 'days',
              lastPaymentAmount: lastDayAmount,
              startDate,
              endDate
            };
          }
          return option.toObject();
        });
        
        // Update the product
        await Product.findByIdAndUpdate(
          product._id,
          { installmentOptions: convertedOptions },
          { new: true }
        );
        
        updatedCount++;
        console.log(`- Updated product ${product._id} with daily installment options`);
      } else {
        console.log(`- Product already has all installment options in days, skipping`);
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
convertAllInstallmentsToDaily()
  .then(result => {
    console.log('Script execution completed');
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 