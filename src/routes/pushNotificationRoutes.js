const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authMiddleware } = require("../../src/middlewares/authMiddleware");

// API to send notification manually
router.post("/send", authMiddleware, notificationController.sendNotification);

module.exports = router;
