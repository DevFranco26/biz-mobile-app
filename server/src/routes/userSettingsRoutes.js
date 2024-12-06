// src/routes/userSettingsRoutes.js
import express from 'express';
import { assignLocationToUser, toggleLocationRestriction, getUserSettings } from '../controllers/userSettingsController.js';
import authMiddleware from '../middlewares/authMiddleware.js'; // Correct path based on your folder structure

const router = express.Router();

// Apply authentication middleware to all routes in this router
router.use(authMiddleware);

// Optionally, add authorization middleware or role checks here

// Assign a location to a user
router.post('/assign', assignLocationToUser);

// Toggle location restriction
router.post('/toggle', toggleLocationRestriction);

// Get all settings for a user
router.get('/all', getUserSettings);

export default router;
