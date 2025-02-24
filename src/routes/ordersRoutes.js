const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orderController'); // Ensure this path is correct
const { authUserMiddleware } = require('../middlewares/authUserMiddleware'); // Import the authentication middleware

// Define route to fetch pending orders, applying the authUserMiddleware
router.get('/pending', authUserMiddleware, ordersController.fetchOrders);
// Additional routes can be added here

module.exports = router;
