// routes/announcementRoutes.js

const express = require('express');
const router = express.Router();
const mediaNewsController = require('../controllers/mediaNewsController/mediaNewsController');
const upload = require('../middlewares/multer'); // Make sure multer is set up correctly
const { authMiddleware } = require('../middlewares/authMiddleware');

router.post('/create', upload.single('file'), mediaNewsController.createMediaNews);
router.get('/',authMiddleware,  mediaNewsController.getMediaNews);
router.put('/:id', upload.single('file'), mediaNewsController.updateMediaNews );
router.delete('/:id', mediaNewsController.deleteMediaNews);


module.exports = router;
