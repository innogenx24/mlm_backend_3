const express = require('express');
const { sendForgotPasswordLink,resetPassword } = require('../controllers/forgotPasswordController');

const router = express.Router();

// Define the POST route to handle forgot password requests
router.post('/', sendForgotPasswordLink);
router.post('/reset', resetPassword);

module.exports = router;