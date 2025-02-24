const express = require("express");
const router = express.Router();
const { updateMember,rejectMember } = require("../controllers/member-controller/memberController");

// Member update route
router.put('/member-update/update/:id', updateMember);

module.exports = router;
