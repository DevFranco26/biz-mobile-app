// File: server/routes/timeLogsRoutes.js

const express = require('express');
const { timeIn, timeOut, getMonthlyLogs, getRangeLogs, getUserTimeLog } = require('../controllers/timeLogsController.js');
const authenticateToken = require('../middlewares/authMiddleware.js');

const router = express.Router();

// Protect all routes below with authentication middleware
router.use(authenticateToken);

// Time-In and Time-Out
router.post('/time-in', timeIn);
router.post('/time-out', timeOut);

// Fetch Logs
router.get('/monthly', getMonthlyLogs);
router.get('/range', getRangeLogs);
router.get('/user/:userId', getUserTimeLog);

module.exports = router;
