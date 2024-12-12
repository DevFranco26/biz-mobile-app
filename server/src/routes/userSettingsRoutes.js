// File: src/routes/userSettingsRoutes.js

import express from 'express';
import { assignLocationToUser, toggleLocationRestriction, getUserSettings } from '../controllers/userSettingsController.js';

const router = express.Router();

// Assign or update user settings
router.post('/assign', assignLocationToUser);

// Toggle location restriction
router.post('/toggle', toggleLocationRestriction);

// Get all user settings
router.get('/all', getUserSettings);

export default router;
