const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Basic product routes
router.post('/', productController.createProduct);
router.get('/', productController.getAllProducts);
router.get('/stats', productController.getProductStats);
router.get('/search', productController.searchProductsAdvanced);
router.get('/low-stock', productController.getLowStockProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/project/:projectId', productController.getProductsByProject);
router.get('/:productId', productController.getProductById);
router.put('/:productId', productController.updateProduct);
router.delete('/:productId', productController.deleteProduct);

// Enhanced regional routes
router.get('/region/:region', productController.getProductsByRegion);
router.get('/region/:region/stats', productController.getRegionalStats);
router.get('/:productId/region/:region', productController.getProductByRegion);
router.post('/:productId/regional-pricing', productController.addRegionalPricing);
router.post('/:productId/regional-availability', productController.addRegionalAvailability);
router.post('/:productId/regional-seo', productController.addRegionalSeo);
router.post('/:productId/related-products', productController.addRelatedProducts);
router.post('/:productId/sync-regional', productController.syncRegionalData);

// Bulk operations
router.post('/bulk/regional-pricing', productController.bulkUpdateRegionalPricing);

module.exports = router;