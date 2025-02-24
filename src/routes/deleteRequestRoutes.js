// routes/sectorRoutes.js
const express = require('express');
const deleteRequest = require('../controllers/deleteRequest/deleteRequest');
const {  authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// CRUD routes
router.post('/', deleteRequest.createDeleteRequest); // Create a sector

router.put('/:id/deleted', deleteRequest.updateStatusToDeleted);
router.put('/:id/rejected', deleteRequest.updateStatusToRejected);
router.get('/user', deleteRequest.getAllDeleteRequests);

// router.get('/',authMiddleware, deleteRequest.getSectors); // Get all sectors
// router.get('/:id', deleteRequest.getSectorById); // Get a sector by ID
// router.put('/:id', deleteRequest.updateSector); // Update a sector
// router.delete('/:id', deleteRequest.deleteSector); // Delete a sector

module.exports = router;
