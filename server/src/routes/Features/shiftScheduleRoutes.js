// src/routes/Features/shiftScheduleRoutes.js

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

router.get("/my", authenticate, authorizeRoles("employee", "admin", "superadmin", "supervisor"), getMyShifts);
router.get("/", authenticate, authorizeRoles("admin", "superadmin", "supervisor"), getAllShiftSchedules);
router.post("/", authenticate, authorizeRoles("admin", "superadmin"), createShiftSchedule);
router.put("/:id", authenticate, authorizeRoles("admin", "superadmin"), updateShiftSchedule);
router.delete("/:id", authenticate, authorizeRoles("admin", "superadmin"), deleteShiftSchedule);
router.post("/:id/assign", authenticate, authorizeRoles("admin", "superadmin", "supervisor"), assignShiftToUser);
router.delete("/:shiftId/assignments/:employeeId", authenticate, authorizeRoles("admin", "superadmin"), deleteUserFromShift);

module.exports = router;
