const axios = require("axios");
const twilio = require("twilio");
require("dotenv").config();
const { User } = require("../../models"); // Import the User model

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

const removeCountryCode = (phoneNumber) => {
  return phoneNumber.replace(/^\+91/, "");
};

// Send OTP function
const sendOtp = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({ success: false, message: "Phone number is required" });
  }

  // Clean the phone number (remove +91)
  const cleanedPhoneNumber = removeCountryCode(phoneNumber);

  // Fetch the user with the cleaned phone number
  const user = await User.findOne({
    where: { mobile_number: cleanedPhoneNumber },
  });

  if (!user) {
    return res.status(404).json({ message: "Mobile number is not found." });
  }

  try {
    // Send OTP using the cleaned phone number
    const verification = await client.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: "sms" });

    return res.status(200).json({
      success: true,
      message: `OTP sent successfully to ${phoneNumber}`,
      data: verification.sid,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};

// Verify OTP function
const verifyOtp = async (req, res) => {
  const { phoneNumber, code } = req.body;

  // Validate input
  if (!phoneNumber || !code) {
    return res.status(400).json({
      success: false,
      message: "Phone number and OTP code are required",
    });
  }

  try {
    // Verify the OTP using Twilio API
    const verificationCheck = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: code });

    // Handle the verification response
    if (verificationCheck.status === "approved") {
      return res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } else if (verificationCheck.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP or incorrect code.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

module.exports = { sendOtp, verifyOtp };
