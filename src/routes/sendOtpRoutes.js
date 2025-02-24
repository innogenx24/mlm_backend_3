const express = require('express');
const router = express.Router();

// Importing the controller that handles OTP sending
const otpController = require('../controllers/otpController');

router.post('/', otpController.sendOtp);

router.post('/verify', otpController.verifyOtp);

module.exports = router;
