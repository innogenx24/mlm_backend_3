// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/customer_feedback_controller/feedbackController');

// Route for creating feedback
router.post('/create', feedbackController.createFeedback);
router.get('/hierarchy/:higher_role_id', feedbackController.getFeedbackForHigherRole);
router.get('/customer/:customer_id', feedbackController.getFeedbackForCustomer);

router.get('/hierarchy', feedbackController.AdMINgetFeedback);

module.exports = router;
