'use strict';

const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');
const { verifyAuth, requireAuth } = require('../middleware/authMiddleware');

// Public searches and details
router.get('/', facilityController.getAllFacilities);
router.get('/:id', facilityController.getFacilityById);

// Protected facility modification operations
router.post('/', verifyAuth, requireAuth, facilityController.createFacility);
router.put('/:id', verifyAuth, requireAuth, facilityController.updateFacility);
router.delete('/:id', verifyAuth, requireAuth, facilityController.deleteFacility);

module.exports = router;
