// File: server/routes/shiftSchedulesRoutes.js

const express = require("express");
const {
  getAllShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
  assignShiftToUser,
  getMyShifts,
  deleteUserFromShift,
} = require("../controllers/shiftScheduleController.js");
const authenticate = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User: Get own shifts
router.get("/my", authorizeRoles("user", "admin", "superadmin", "supervisor"), getMyShifts);

// admin/SuperAdmin/supervisor: Get all shifts
router.get("/", authorizeRoles("admin", "superadmin", "supervisor"), getAllShiftSchedules);

// admin/SuperAdmin: Create, Update, Delete shifts
router.post("/", authorizeRoles("admin", "superadmin"), createShiftSchedule);
router.put("/:id", authorizeRoles("admin", "superadmin"), updateShiftSchedule);
router.delete("/:id", authorizeRoles("admin", "superadmin"), deleteShiftSchedule);

// admin/SuperAdmin/supervisor: Assign shifts to users
router.post("/:id/assign", authorizeRoles("admin", "superadmin", "supervisor"), assignShiftToUser);

// Route to delete a user from a shift
router.delete("/:shiftId/assignments/:userId", authorizeRoles("admin", "superadmin"), deleteUserFromShift);

module.exports = router;
