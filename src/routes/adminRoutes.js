const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, isAdmin } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/multer'); // Make sure multer is set up correctly


// Admin routes
router.post('/signup', adminController.signUp); // Admin sign-up
router.post('/signin', adminController.signIn); // Admin sign-in
router.put('/update', upload.single('image'),authMiddleware, adminController.updateAdmin);
router.get('/admin-details' ,authMiddleware,adminController.getAdminDetails);
// router.get('/update-admin' ,authMiddleware,isAdmin,adminController.updateAdmin);


module.exports = router;
