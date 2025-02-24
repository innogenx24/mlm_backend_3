const express = require('express');
const rolesController = require('../controllers/roles_controllers/rolesController');
const { isAdmin, authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

// Define routes for CRUD operations
router.get('/role-list',authMiddleware, rolesController.getRoles);
router.post('/create',authMiddleware,isAdmin, rolesController.createRole);

module.exports = router;
