// routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcements_controller/announcementsController');
const upload = require('../middlewares/multer'); // Make sure multer is set up correctly
const { authMiddleware } = require('../middlewares/authMiddleware');

router.get('/',authMiddleware,  announcementController.getAnnouncements);
router.get('/:id', announcementController.getByIdAnnouncement);
router.post('/create', upload.single('file'), announcementController.createAnnouncement);
router.put('/:id', upload.single('file'), announcementController.updateByIdAnnouncement);
router.delete('/:id', announcementController.deleteByIdAnnouncement);

module.exports = router;
