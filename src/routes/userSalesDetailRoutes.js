// In routes file
const express = require('express');
const router = express.Router();
const userSalesDetail = require('../controllers/user_sales_detail/userSalesDetail');
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/sales_achievement/:role/:user_id', userSalesDetail.getMonthlySalesDetails);
router.get('/sales_achievementWeb/:role/:user_id', userSalesDetail.getMonthlySalesDetailsWeb);
router.get('/yearly_sales_achievement/:role/:user_id', userSalesDetail.getYearlySalesDetails);

// router.get('/getLowHierarchySalesDetails/:user_id', userSalesDetail.getLowHierarchySalesDetails);
router.get('/getLowHierarchySalesDetails/:user_id/:month_year', userSalesDetail.getLowHierarchySalesDetails);


router.get('/getLowHierarchySalesDetailsId/:user_id',userSalesDetail.getUserCurrentMonthSalesDetailsId);

module.exports = router;