// server/src/routes/locationRoutes.js

import express from 'express';
import { createLocation, getLocations, updateLocation, deleteLocation } from '../controllers/locationController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js'; // Correct import source

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// Apply authorization middleware to ensure only admins can access these routes
router.use(authorizeRoles('admin')); // Adjust roles as needed

// Create a new location
router.post('/create', createLocation);

// Get all locations for an admin
router.get('/all', getLocations);

// Update a location
router.put('/update/:locationId', updateLocation);

// Delete a location
router.delete('/delete/:locationId', deleteLocation);

export default router;
