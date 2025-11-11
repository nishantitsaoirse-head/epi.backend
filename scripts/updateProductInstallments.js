/**
 * Script to update all products with empty installmentOptions
 * This will generate new installment options with proper calculations and update them in DB
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

async function updateProductsWithEmptyInstallments() {
  try {
    console.log('Finding products with empty installmentOptions...');
    
    // Find all products where installmentOptions array is empty or doesn't exist
    const productsToUpdate = await Product.find({
      $or: [
        { installmentOptions: { $exists: false } },
        { installmentOptions: { $size: 0 } },
        { installmentOptions: null }
      ]
    });
    
    console.log(`Found ${productsToUpdate.length} products with empty installmentOptions`);
    
    // Update each product
    let updatedCount = 0;
    
    for (const product of productsToUpdate) {
      if (!product.price) {
        console.log(`Skipping product ${product._id} - no price defined`);
        continue;
      }
      
      console.log(`Updating product: ${product._id}, price: ${product.price}`);
      
      // Generate new installment options
      const installmentOptions = generateInstallmentOptions(product.price);
      
      // Update the product
      await Product.findByIdAndUpdate(
        product._id,
        { installmentOptions },
        { new: true }
      );
      
      updatedCount++;
      console.log(`Updated product ${product._id} with new installment options`);
    }
    
    console.log('Update complete!');
    console.log(`Updated ${updatedCount} products out of ${productsToUpdate.length} found`);
    
    return { success: true, updated: updatedCount, total: productsToUpdate.length };
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
updateProductsWithEmptyInstallments()
  .then(result => {
    console.log('Script execution completed');
    console.log(result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Script execution failed:', error);
    process.exit(1);
  }); 