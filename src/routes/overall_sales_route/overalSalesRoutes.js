const express = require('express');
const router = express.Router();
const { getOverallSalesCalculation,
    getMostSellingProductPercentage,
    salesOverTime,
    getStockTargetDetails } = require('../../controllers/overall_sales_calculation_controller/getOverallSalesCalculation');
const { authMiddleware } = require('../../middlewares/authMiddleware');


// Route to get notifications
router.get('/rolebased_sales', authMiddleware, getOverallSalesCalculation);
router.post('/mostl_selled_product', authMiddleware, getMostSellingProductPercentage);
router.post('/sales_over_time', authMiddleware, salesOverTime);
router.get('/stock_over_detail', authMiddleware, getStockTargetDetails);



module.exports = router;
