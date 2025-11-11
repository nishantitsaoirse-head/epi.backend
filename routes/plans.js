const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth');
const planController = require('../controllers/planController');

/**
 * @route   GET /api/plans
 * @desc    Get user's current plan with all products (only active products)
 * @access  Private
 */
router.post('/', (req, res) => {
  req.body.userId
  planController.getCurrentPlan(req, res);
});

/**
 * @route   GET /api/plans/pending
 * @desc    Get user's pending products waiting for first payment
 * @access  Private
 */
router.get('/pending', verifyToken, (req, res) => {
  req.body.userId = req.user._id;
  planController.getPendingProducts(req, res);
});

/**
 * @route   GET /api/plans/:planId/products/:productId
 * @desc    Get specific product details in a plan
 * @access  Private
 */
router.post('/:planId/products/:productId', (req, res) => {
  req.body.userId
  planController.getPlanProductDetail(req, res);
});

/**
 * @route   POST /api/plans/products
 * @desc    Add a product to user's plan
 * @access  Private
 */
router.post('/products', verifyToken, (req, res) => {
  req.body.userId = req.user._id;
  planController.addProductToPlan(req, res);
});

/**
 * @route   POST /api/plans/:planId/products/:productId/payment
 * @desc    Make a payment for a product in a plan
 * @access  Private
 */
router.post('/:planId/products/:productId/payment', (req, res) => {
  req.body.userId = req.body.userId;
  req.body.planId = req.params.planId;
  req.body.productId = req.params.productId;
  planController.makeProductPayment(req, res);
});

/**
 * @route   DELETE /api/plans/:planId/products/:productId
 * @desc    Remove a product from a plan
 * @access  Private
 */
router.delete('/:planId/products/:productId', verifyToken, (req, res) => {
  req.body.userId = req.user._id;
  planController.removeProductFromPlan(req, res);
});

/**
 * @route   POST /api/plans/:planId/fix
 * @desc    Fix calculation issues in a plan
 * @access  Public (uses userId from body)
 */
router.post('/:planId/fix', async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.body.userId || "6814552802673558322e2567"; // Use provided userId or default
    
    // Find the plan
    const plan = await require('../models/Plan').findOne({ 
      _id: planId
    });
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Recalculate totals
    let totalAmount = 0;
    let completedAmount = 0;
    
    for (const product of plan.products) {
      totalAmount += product.totalProductAmount || 0;
      completedAmount += product.paidAmount || 0;
    }
    
    // Update the plan
    plan.totalAmount = totalAmount;
    plan.completedAmount = completedAmount;
    
    await plan.save();
    
    res.status(200).json({ 
      message: 'Plan fixed successfully', 
      totalAmount,
      completedAmount,
      plan
    });
  } catch (error) {
    console.error('Error fixing plan:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 