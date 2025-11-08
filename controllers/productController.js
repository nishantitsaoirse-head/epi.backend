const Product = require('../models/Product');
const { calculateEquivalentValues } = require('../utils/productUtils');

/**
 * Get a single product with detailed information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log(`Fetching product details for ID: ${productId}`);
    
    // Get wishlist from request body
    const { wishlist = [] } = req.body;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Create a response object with product data
    const productData = product.toObject();
    console.log('Product retrieved, price:', productData.price);
    
    // Add isWishlisted property
    productData.isWishlisted = wishlist.includes(productId);
    
    // Check if installmentOptions are missing but price exists
    if ((!productData.installmentOptions || productData.installmentOptions.length === 0) && productData.price) {
      console.log('Product has no installmentOptions, generating them now...');
      const { generateInstallmentOptions } = require('../utils/productUtils');
      productData.installmentOptions = generateInstallmentOptions(productData.price);
      
      // Update the product in the database to save these options
      await Product.findByIdAndUpdate(productId, { 
        installmentOptions: productData.installmentOptions 
      });
      
      console.log('Updated product with new installmentOptions');
    }
    
    // Filter out installment options with period less than 30
    if (productData.installmentOptions && Array.isArray(productData.installmentOptions)) {
      console.log('Filtering out installment options with period less than 30 days');
      productData.installmentOptions = productData.installmentOptions.filter(option => {
        const periodValue = parseInt(option.period);
        return !isNaN(periodValue) && periodValue >= 30;
      });
    }
    
    // Enrich installment options with equivalent values
    if (productData.installmentOptions && productData.installmentOptions.length > 0) {
      console.log('Enriching installmentOptions with equivalent values');
      productData.installmentOptions = productData.installmentOptions.map(option => {
        // Convert date strings to Date objects if they're not already
        if (option.startDate && typeof option.startDate === 'string') {
          option.startDate = new Date(option.startDate);
        }
        if (option.endDate && typeof option.endDate === 'string') {
          option.endDate = new Date(option.endDate);
        }
        
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
          summary: `Pay ${regularPayment} daily for ${numPayments - 1} days, then ${finalPayment} for the final payment.`
        };
        
        return enrichedOption;
      });
    }
    
    res.status(200).json(productData);
  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get all products with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category, isCombo, isSpecialPrice, search, 
      brand, minPrice, maxPrice, minRating,
      page = 1, limit = 10, sort = 'createdAt', order = 'desc',
      shuffle = 'false' // Added shuffle parameter with default value 'false'
    } = req.query;
    
    // Get wishlist from request body
    const { wishlist = [] } = req.body;
    
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    if (isCombo === 'true') filter.isCombo = true;
    else if (isCombo === 'false') filter.isCombo = false;
    if (isSpecialPrice === 'true') filter.isSpecialPrice = true;
    else if (isSpecialPrice === 'false') filter.isSpecialPrice = false;
    if (brand) filter.brand = brand;
    
    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = parseFloat(maxPrice);
    }
    
    // Rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    
    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination info
    const total = await Product.countDocuments(filter);
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    let products;
    
    if (shuffle === 'true') {
      // Use MongoDB's $sample operator to randomly select documents when shuffle is true
      products = await Product.aggregate([
        { $match: filter },
        { $sample: { size: parseInt(limit) } }
      ]);
    } else {
      // Build sort object for normal sorting
      const sortObj = {};
      sortObj[sort] = order === 'asc' ? 1 : -1;
      
      // Get paginated products with sorting
      products = await Product.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));
    }
    
    // Add isWishlisted property to each product and filter installment options
    const productsWithWishlistStatus = products.map(product => {
      // Handle both mongoose document and aggregate result
      const productObj = product.toObject ? product.toObject() : product;
      productObj.isWishlisted = wishlist.includes(productObj._id.toString());
      
      // Filter out installment options with period less than 30
      if (productObj.installmentOptions && Array.isArray(productObj.installmentOptions)) {
        productObj.installmentOptions = productObj.installmentOptions.filter(option => {
          // Check if period is a number or if it's a string that can be converted to a number
          const periodValue = parseInt(option.period);
          return !isNaN(periodValue) && periodValue >= 30;
        });
      }
      
      return productObj;
    });
    
    res.status(200).json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      products: productsWithWishlistStatus,
      sortBy: shuffle === 'true' ? 'random' : sort,
      sortOrder: shuffle === 'true' ? 'random' : order,
      shuffle: shuffle === 'true'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Update installment options for products with empty installmentOptions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateProductInstallments = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // If product ID is provided, update just that product
    if (productId) {
      const product = await Product.findById(productId);
      
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      
      if (!product.price) {
        return res.status(400).json({ message: 'Product has no price defined' });
      }
      
      const installmentOptions = generateInstallmentOptions(product.price);
      
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { installmentOptions },
        { new: true }
      );
      
      return res.status(200).json({
        message: 'Product installment options updated successfully',
        product: updatedProduct
      });
    }
    
    // If no product ID, find products with empty installmentOptions
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
    }
    
    res.status(200).json({
      message: `Updated ${updatedCount} products out of ${productsToUpdate.length} found`,
      updated: updatedCount,
      total: productsToUpdate.length
    });
  } catch (error) {
    console.error('Error updating product installments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 