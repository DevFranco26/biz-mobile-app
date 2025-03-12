// src/routes/Features/timeLogRoutes.js

const express = require("express");
const router = express.Router();
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

router.post("/time-in", authenticate, timeIn);
router.post("/time-out", authenticate, timeOut);
router.post("/coffee-break", authenticate, coffeeBreakToggle);
router.post("/lunch-break", authenticate, lunchBreakToggle);
router.get("/monthly", authenticate, getMonthlyLogs);
router.get("/range", authenticate, getRangeLogs);
router.get("/employee/:employeeId", authenticate, getUserTimeLog);

module.exports = router;
