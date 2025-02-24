const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request_controller/requestController');

// Define routes
router.get('/', requestController.fetchRequests); // Fetch requests
router.post('/create', requestController.createRequest); // Create a request
router.put('/approval', requestController.handleApproval); // Handle approval/forwarding

module.exports = router;
