// src/routes/locationRoutes.js

import express from 'express';
import { createLocation, getLocations, updateLocation, deleteLocation } from '../controllers/locationController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Temporarily remove role checks to ensure it's not blocking
router.use(authorizeRoles('admin'));

router.post('/create', createLocation);
router.get('/all', getLocations);
router.put('/update/:locationId', updateLocation);
router.delete('/delete/:locationId', deleteLocation);

export default router;
