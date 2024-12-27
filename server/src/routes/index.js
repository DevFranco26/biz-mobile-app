// src/routes/index.js

import express from 'express';
import authRoutes from './authRoutes.js';
import timeLogsRoutes from './timeLogsRoutes.js';
import locationRoutes from './locationRoutes.js';
import userSettingsRoutes from './userSettingsRoutes.js';
import usersRoutes from './usersRoutes.js';
import companiesRoutes from './companiesRoutes.js';
import leavesRoutes from './leavesRoutes.js';
import shiftSchedulesRoutes from './shiftSchedulesRoutes.js'; // Import the shift schedules routes
import authenticate from '../middlewares/authMiddleware.js';
import updateActivityMiddleware from '../middlewares/updateActivityMiddleware.js';
import payrollRoutes from './payrollRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);

// Apply authentication and activity update middleware to all subsequent routes
router.use(authenticate, updateActivityMiddleware);

router.use('/timelogs', timeLogsRoutes);
router.use('/locations', locationRoutes);
router.use('/usersettings', userSettingsRoutes);
router.use('/users', usersRoutes);
router.use('/companies', companiesRoutes);
router.use('/leaves', leavesRoutes);
router.use('/shiftschedules', shiftSchedulesRoutes); 
router.use('/payroll', payrollRoutes);

export default router;
