// src/routes/timeLogsRoutes.js

import express from 'express';
import { timeIn, timeOut, getMonthlyLogs, getRangeLogs, getUserTimeLog } from '../controllers/timeLogsController.js';
import authenticateToken from '../middlewares/authMiddleware.js';

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

export default router;
