import express from 'express';
import { timeIn, timeOut, getMonthlyLogs, getUserTimeLog } from '../controllers/timeLogsController.js';

const router = express.Router();

// POST routes
router.post('/time-in', timeIn);
router.post('/time-out', timeOut);

// GET route
router.get('/monthly-logs', getMonthlyLogs);
router.get('/:userId', getUserTimeLog);

export default router;
