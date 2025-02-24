const express = require("express");
const router = express.Router();
const fcmTokenController = require("../controllers/fcmTokenController");

// API Routes for FCM Tokens
router.post("/save-token", fcmTokenController.createToken); // Save Token
router.get("/get-tokens", fcmTokenController.getTokens); // Get All Tokens

module.exports = router;
