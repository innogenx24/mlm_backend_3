// routes/documentRoutes.js

const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document_controller/documentController'); // Adjust the path as needed
const upload = require('../middlewares/multer'); // Make sure multer is set up correctly
const { authMiddleware,isAdmin } = require('../middlewares/authMiddleware');
const { authUserMiddleware } = require('../middlewares/authUserMiddleware'); // Import the authentication middleware

router.get('/',authMiddleware, documentController.getDocuments);
router.get('/admin',authMiddleware, documentController.getDocumentsAdmin);


router.get('/:id', documentController.getByIdDocument);

router.post('/create', upload.single('file'), documentController.createDocument);

// PUT route for updating a document by ID
router.put('/:id', upload.single('file'), documentController.updateByIdDocument);

router.delete('/:id', documentController.deleteByIdDocument);

module.exports = router;
