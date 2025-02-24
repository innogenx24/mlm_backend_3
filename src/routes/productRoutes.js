const express = require('express');
const productController = require('../controllers/productController');
const router = express.Router();
const upload = require('../middlewares/multer'); // Multer middleware for file uploads
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');

// Routes for CRUD operations
router.get('/admin_product',authMiddleware, productController.getAllProducts);
router.get('/admin_product/:id',authMiddleware, productController.getProductById);
router.post('/', upload.single('image'), authMiddleware, isAdmin, productController.createProduct);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.put('/:id/status', productController.updateProductStatus);
router.delete('/:id', authMiddleware, isAdmin, productController.deleteProduct);
//
router.get('/user_product',authMiddleware, productController.getAllProductsForUser); 
router.get('/user_product/:id',authMiddleware, productController.getProductByIdForUser);

module.exports = router;


