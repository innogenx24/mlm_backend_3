const express = require("express");
const router = express.Router();
const salesTargetController = require('../controllers/salestarget_controller/salesTargetController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Sales Target Routes
// router.post("/create", salesTargetController.createSalesTarget); 
router.get("/",authMiddleware, salesTargetController.getSalesStockTargets);          
router.put('/:role_name', salesTargetController.updateSalesStockTarget);

module.exports = router;
