const express = require('express');
const router = express.Router();
const userHierarchyController = require('../controllers/hierarchy_user_controllers/userHierarchyController');

// User hirarchy (member) routes //
router.get('/mds',userHierarchyController.getMasterDistributorsByADO);
router.get('/sds',userHierarchyController.getSuperDistributorsByMD);
router.get('/ds',userHierarchyController.getDistributorsBySD);
router.get('/cs',userHierarchyController.getCustomersByDistributor);


module.exports = router;