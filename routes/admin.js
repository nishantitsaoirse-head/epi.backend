const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const Product = require('../models/Product');
const { generateInstallmentOptions } = require('../utils/productUtils');

/**
 * @route   POST /api/admin/update-installments
 * @desc    Update installment options for all products with empty installmentOptions
 * @access  Admin
 */
router.post('/update-installments', verifyToken, isAdmin, async (req, res) => {
  try {
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
    const updatedProducts = [];
    
    for (const product of productsToUpdate) {
      if (!product.price) {
        console.log(`Skipping product ${product._id} - no price defined`);
        continue;
      }
      
      console.log(`Updating product: ${product._id}, price: ${product.price}`);
      
      // Generate new installment options
      const installmentOptions = generateInstallmentOptions(product.price);
      
      // Update the product
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { installmentOptions },
        { new: true }
      );
      
      updatedCount++;
      updatedProducts.push({
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        installmentOptions: updatedProduct.installmentOptions
      });
      
      console.log(`Updated product ${product._id} with new installment options`);
    }
    
    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} products out of ${productsToUpdate.length} found`,
      updated: updatedCount,
      total: productsToUpdate.length,
      products: updatedProducts
    });
  } catch (error) {
    console.error('Error updating products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating products', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/admin/update-product-installments/:id
 * @desc    Update installment options for a specific product
 * @access  Admin
 */
router.post('/update-product-installments/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }
    
    if (!product.price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product has no price defined' 
      });
    }
    
    // Generate new installment options
    const installmentOptions = generateInstallmentOptions(product.price);
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { installmentOptions },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Product installment options updated successfully',
      product: {
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price,
        installmentOptions: updatedProduct.installmentOptions
      }
    });
  } catch (error) {
    console.error('Error updating product installments:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating product installments', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/admin/regenerate-all-installments
 * @desc    Force regenerate installment options for ALL products
 * @access  Admin
 */
router.post('/regenerate-all-installments', verifyToken, isAdmin, async (req, res) => {
  try {
    // Find all products
    const products = await Product.find({});
    
    console.log(`Found ${products.length} products total`);
    
    // Update each product
    let updatedCount = 0;
    let skippedCount = 0;
    const updatedProducts = [];
    
    for (const product of products) {
      if (!product.price) {
        console.log(`Skipping product ${product._id} - no price defined`);
        skippedCount++;
        continue;
      }
      
      console.log(`Processing product: ${product._id}, name: ${product.name}, price: ${product.price}`);
      
      // Generate new installment options
      const installmentOptions = generateInstallmentOptions(product.price);
      
      // Update the product
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { installmentOptions },
        { new: true }
      );
      
      updatedCount++;
      updatedProducts.push({
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price
      });
      
      console.log(`Updated product ${product._id} with new installment options`);
    }
    
    res.status(200).json({
      success: true,
      message: `Updated all products with new installment options. Updated: ${updatedCount}, Skipped: ${skippedCount}, Total: ${products.length}`,
      updated: updatedCount,
      skipped: skippedCount,
      total: products.length
    });
  } catch (error) {
    console.error('Error updating products:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating products', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/admin/convert-to-daily-installments
 * @desc    Convert all installment options to use daily units
 * @access  Admin
 */
router.post('/convert-to-daily-installments', verifyToken, isAdmin, async (req, res) => {
  try {
    // Find all products
    const products = await Product.find({});
    
    console.log(`Found ${products.length} products total`);
    
    // Update each product
    let updatedCount = 0;
    let skippedCount = 0;
    const updatedProducts = [];
    
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
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          { installmentOptions },
          { new: true }
        );
        
        updatedCount++;
        updatedProducts.push({
          id: updatedProduct._id,
          name: updatedProduct.name,
          price: updatedProduct.price
        });
        
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
              ...option.toObject ? option.toObject() : option,
              amount: dailyAmount,
              period: periodInDays.toString(),
              periodUnit: 'days',
              lastPaymentAmount: lastDayAmount,
              startDate,
              endDate
            };
          }
          return option.toObject ? option.toObject() : option;
        });
        
        // Update the product
        const updatedProduct = await Product.findByIdAndUpdate(
          product._id,
          { installmentOptions: convertedOptions },
          { new: true }
        );
        
        updatedCount++;
        updatedProducts.push({
          id: updatedProduct._id,
          name: updatedProduct.name,
          price: updatedProduct.price
        });
        
        console.log(`- Updated product ${product._id} with daily installment options`);
      } else {
        console.log(`- Product already has all installment options in days, skipping`);
        skippedCount++;
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} products to use daily installment options. Skipped: ${skippedCount}, Total: ${products.length}`,
      updated: updatedCount,
      skipped: skippedCount,
      total: products.length
    });
  } catch (error) {
    console.error('Error converting installment options:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error converting installment options', 
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/admin/update-installment-amounts
 * @desc    Update all products with new installment options starting from 100 rupees
 * @access  Admin
 */
router.post('/update-installment-amounts', verifyToken, isAdmin, async (req, res) => {
  try {
    // Find all products
    const products = await Product.find({});
    
    console.log(`Found ${products.length} products total`);
    
    // Update each product
    let updatedCount = 0;
    let skippedCount = 0;
    const updatedProducts = [];
    
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
      const updatedProduct = await Product.findByIdAndUpdate(
        product._id,
        { installmentOptions },
        { new: true }
      );
      
      updatedCount++;
      updatedProducts.push({
        id: updatedProduct._id,
        name: updatedProduct.name,
        price: updatedProduct.price
      });
      
      console.log(`- Updated product ${product._id} with new installment options starting from 100 rupees/day`);
    }
    
    res.status(200).json({
      success: true,
      message: `Updated ${updatedCount} products with new installment options starting from 100 rupees/day. Skipped: ${skippedCount}, Total: ${products.length}`,
      updated: updatedCount,
      skipped: skippedCount,
      total: products.length
    });
  } catch (error) {
    console.error('Error updating installment amounts:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating installment amounts', 
      error: error.message 
    });
  }
});

module.exports = router; 