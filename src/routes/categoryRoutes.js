const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category_controller/categoryController');
const {  authMiddleware } = require('../middlewares/authMiddleware');

router.post('/', categoryController.createCategory);
router.get('/',authMiddleware, categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
