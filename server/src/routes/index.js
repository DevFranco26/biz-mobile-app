// src/routes/index.js

import express from 'express';
import authRoutes from './authRoutes.js';
import timeLogsRoutes from './timeLogsRoutes.js';
import locationRoutes from './locationRoutes.js';
import userSettingsRoutes from './userSettingsRoutes.js';
import usersRoutes from './usersRoutes.js';
import companiesRoutes from './companiesRoutes.js';
import leavesRoutes from './leavesRoutes.js'; 

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/timelogs', timeLogsRoutes);
router.use('/locations', locationRoutes);
router.use('/usersettings', userSettingsRoutes);
router.use('/users', usersRoutes);
router.use('/companies', companiesRoutes);
router.use('/leaves', leavesRoutes);

export default router;
