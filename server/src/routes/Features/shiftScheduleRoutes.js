// File: src/routes/Features/shiftScheduleRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const {
  getAllShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
  assignShiftToUser,
  getMyShifts,
  deleteUserFromShift,
} = require("@controllers/Features/shiftScheduleController");

// All routes require authentication
router.use(authenticate);

// Employees (and higher) get their own shifts
router.get("/my", authorizeRoles("employee", "admin", "superadmin", "supervisor"), getMyShifts);

// Admin, superadmin, or supervisor get all shift schedules
router.get("/", authorizeRoles("admin", "superadmin", "supervisor"), getAllShiftSchedules);

// Admin and superadmin can create, update, or delete shifts
router.post("/", authorizeRoles("admin", "superadmin"), createShiftSchedule);
router.put("/:id", authorizeRoles("admin", "superadmin"), updateShiftSchedule);
router.delete("/:id", authorizeRoles("admin", "superadmin"), deleteShiftSchedule);

// Admin, superadmin, or supervisor can assign a shift to an employee
router.post("/:id/assign", authorizeRoles("admin", "superadmin", "supervisor"), assignShiftToUser);

// Admin and superadmin can remove an employee from a shift
router.delete("/:shiftId/assignments/:employeeId", authorizeRoles("admin", "superadmin"), deleteUserFromShift);

module.exports = router;
