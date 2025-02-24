const express = require('express');
const router = express.Router();
const userHierarchyController = require('../controllers/direct_hierarchy_user_controller/DirectHierarchyUserController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');


// router.get('/sds-by-ado', userHierarchyController.getSDsByADO);
// router.get('/ds-by-ado', userHierarchyController.getDistributorsByADO);
// router.get('/cs-by-ado', userHierarchyController.getCoustomersByADO);
router.get('/users-by-ado', userHierarchyController.getUsersByADOAndRole);
router.get('/users-by-md', userHierarchyController.getUsersByMDAndRole);
router.get('/users-by-sd', userHierarchyController.getUsersBySDAndRole);
router.get('/user-profile',authMiddleware, userHierarchyController.getUserProfile);
router.get('/profile-hirarchy',authMiddleware, userHierarchyController.getUserProfileByHierarchy);
router.get('/profileby-admin/:userId',authMiddleware, userHierarchyController.getUserProfileByAdmin);




module.exports = router;