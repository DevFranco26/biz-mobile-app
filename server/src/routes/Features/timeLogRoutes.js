// File: src/routes/Features/timeLogRoutes.js
const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const authenticate = require("@middlewares/authMiddleware");
const {
  timeIn,
  timeOut,
  getMonthlyLogs,
  getRangeLogs,
  getUserTimeLog,
  coffeeBreakToggle,
  lunchBreakToggle,
} = require("@controllers/Features/timeLogController");

// All routes require authentication
router.use(authenticate);

// Record time in and out
router.post("/time-in", timeIn);
router.post("/time-out", timeOut);

// Toggle coffee and lunch breaks
router.post("/coffee-break", coffeeBreakToggle);
router.post("/lunch-break", lunchBreakToggle);

// Fetch logs
router.get("/monthly", getMonthlyLogs);
router.get("/range", getRangeLogs);
router.get("/employee/:employeeId", getUserTimeLog);

module.exports = router;
