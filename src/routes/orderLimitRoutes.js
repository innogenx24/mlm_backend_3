const express = require('express');
const router = express.Router();
const orderLimitController = require('../controllers/orderLimitController');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/', authMiddleware,orderLimitController.getOrderLimits);
router.post('/create', orderLimitController.createOrderLimit);
router.put('/:id', orderLimitController.updateOrderLimit);
router.delete('/:id', orderLimitController.deleteOrderLimit);

module.exports = router;
