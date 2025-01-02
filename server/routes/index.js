// File: server/routes/index.js

const express = require('express');

// Import Routes
const authRoutes = require('./authRoutes.js');
const timeLogsRoutes = require('./timeLogsRoutes.js');
const locationRoutes = require('./locationRoutes.js');
const userSettingsRoutes = require('./userSettingsRoutes.js');
const usersRoutes = require('./usersRoutes.js');
const companiesRoutes = require('./companiesRoutes.js');
const leavesRoutes = require('./leavesRoutes.js');
const shiftSchedulesRoutes = require('./shiftSchedulesRoutes.js');
const payrollRoutes = require('./payrollRoutes.js');

// Import Middlewares
const authenticate = require('../middlewares/authMiddleware.js');
const updateActivityMiddleware = require('../middlewares/updateActivityMiddleware.js');

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

module.exports = router;
