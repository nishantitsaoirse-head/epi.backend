const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/auth');
const Product = require('../models/Product');
const productController = require('../controllers/productController');
const { generateInstallmentOptions } = require('../utils/productUtils');
const User = require('../models/User');

// Get all products
router.post('/', productController.getAllProducts);

// Create a new product - Moving this before the /:id route to prevent conflicts
router.post('/add', async (req, res) => {
  try {
    const { 
      name, description, price, originalPrice, images, 
      category, isCombo, comboProducts, 
      stock, minimumSavingDays, isSpecialPrice,
      brand, model, features, specifications,
      rating, reviewCount, likePercentage,
      installmentOptions
    } = req.body;
    
    // Generate installment options based on price if not provided
    const productInstallmentOptions = installmentOptions || generateInstallmentOptions(price);
    console.log('Generated installment options:', productInstallmentOptions);
    
    const product = new Product({
      name,
      description,
      price,
      originalPrice,
      brand,
      model,
      features: features || [],
      specifications: specifications || {},
      rating: rating || 0,
      reviewCount: reviewCount || 0,
      likePercentage: likePercentage || 0,
      images: images || [],
      category,
      isCombo: isCombo || false,
      isSpecialPrice: isSpecialPrice || false,
      comboProducts: comboProducts || [],
      stock: stock || 0,
      minimumSavingDays: minimumSavingDays || 30,
      installmentOptions: productInstallmentOptions
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update installment options for all products with empty installmentOptions
router.post('/update-installments', verifyToken, isAdmin, productController.updateProductInstallments);

// Update installment options for a specific product
router.post('/update-installments/:productId', verifyToken, isAdmin, productController.updateProductInstallments);

// Get a single product by ID
router.post('/:id', productController.getProductDetails);

// Admin routes

// Update a product
router.put('/:id', async (req, res) => {
  try {
    const { 
      name, description, price, originalPrice, images, 
      category, isCombo, comboProducts, 
      stock, minimumSavingDays, isActive, isSpecialPrice,
      brand, model, features, specifications,
      rating, reviewCount, likePercentage,
      installmentOptions
    } = req.body;
    
    const updates = {};
    
    if (name) updates.name = name;
    if (description) updates.description = description;
    if (price) updates.price = price;
    if (originalPrice !== undefined) updates.originalPrice = originalPrice;
    if (brand) updates.brand = brand;
    if (model) updates.model = model;
    if (features) updates.features = features;
    if (specifications) updates.specifications = specifications;
    if (rating !== undefined) updates.rating = rating;
    if (reviewCount !== undefined) updates.reviewCount = reviewCount;
    if (likePercentage !== undefined) updates.likePercentage = likePercentage;
    if (images) updates.images = images;
    if (category) updates.category = category;
    if (isCombo !== undefined) updates.isCombo = isCombo;
    if (isSpecialPrice !== undefined) updates.isSpecialPrice = isSpecialPrice;
    if (comboProducts) updates.comboProducts = comboProducts;
    if (stock !== undefined) updates.stock = stock;
    if (minimumSavingDays) updates.minimumSavingDays = minimumSavingDays;
    if (isActive !== undefined) updates.isActive = isActive;
    if (installmentOptions) updates.installmentOptions = installmentOptions;
    
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint to generate installment options 
router.get('/generate-options/:price', (req, res) => {
  try {
    const price = parseFloat(req.params.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    
    const options = generateInstallmentOptions(price);
    res.status(200).json(options);
  } catch (error) {
    console.error('Error generating options:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Fix installment options for a specific product (public endpoint)
router.get('/fix-installments/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    if (!product.price) {
      return res.status(400).json({ message: 'Product has no price defined' });
    }
    
    console.log(`Fixing installment options for product: ${product._id}, price: ${product.price}`);
    
    // Generate new installment options
    const installmentOptions = generateInstallmentOptions(product.price);
    
    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { installmentOptions },
      { new: true }
    );
    
    // Enrich the installment options with equivalent values and payment schedule
    const enrichedProduct = {...updatedProduct.toObject()};
    
    if (enrichedProduct.installmentOptions && enrichedProduct.installmentOptions.length > 0) {
      enrichedProduct.installmentOptions = enrichedProduct.installmentOptions.map(option => {
        // Convert date strings to Date objects if they're not already
        if (option.startDate && typeof option.startDate === 'string') {
          option.startDate = new Date(option.startDate);
        }
        if (option.endDate && typeof option.endDate === 'string') {
          option.endDate = new Date(option.endDate);
        }
        
        const { calculateEquivalentValues } = require('../utils/productUtils');
        const enrichedOption = calculateEquivalentValues(option);
        
        // Add payment schedule summary
        const numPayments = parseInt(option.period);
        const regularPayment = option.amount;
        const finalPayment = option.lastPaymentAmount || regularPayment;
        
        enrichedOption.paymentSchedule = {
          regularPayments: {
            amount: regularPayment,
            count: numPayments - 1
          },
          finalPayment: {
            amount: finalPayment,
            date: option.endDate
          },
          summary: `Pay ${regularPayment} ${option.periodUnit === 'days' ? 'daily' : 'monthly'} for ${numPayments - 1} ${option.periodUnit}, then ${finalPayment} for the final payment.`
        };
        
        return enrichedOption;
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product installment options fixed successfully',
      product: enrichedProduct
    });
  } catch (error) {
    console.error('Error fixing product installments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * @route   POST /api/products/:id/toggle-wishlist/:userId
 * @desc    Toggle product in user's wishlist
 * @access  Public
 */
router.post('/:id/toggle-wishlist/:userId', async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.params.userId;
    
    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if product is already in wishlist
    const isInWishlist = user.wishlist.some(id => id.toString() === productId);
    
    if (isInWishlist) {
      // Remove from wishlist
      user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product removed from wishlist',
        isInWishlist: false
      });
    } else {
      // Add to wishlist
      user.wishlist.push(productId);
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: 'Product added to wishlist',
        isInWishlist: true
      });
    }
  } catch (error) {
    console.error('Error toggling wishlist:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 