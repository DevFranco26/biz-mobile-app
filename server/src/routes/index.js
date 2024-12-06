// src/routes/index.js

import express from 'express';
import authRoutes from './authRoutes.js';
import timeLogsRoutes from './timeLogsRoutes.js';
import locationRoutes from './locationRoutes.js';
import userSettingsRoutes from './userSettingsRoutes.js';
import adminRoutes from './adminRoutes.js'; 

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/timelogs', timeLogsRoutes);
router.use('/locations', locationRoutes);
router.use('/usersettings', userSettingsRoutes);
router.use('/admin', adminRoutes); // Use admin routes

export default router;
