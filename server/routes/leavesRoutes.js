// File: server/routes/leavesRoutes.js

const express = require("express");
const {
  submitLeaveRequest,
  getUserLeaves,
  getPendingLeavesForApprover,
  approveLeave,
  rejectLeave,
  getApprovers,
  getLeavesForApprover,
} = require("../controllers/leavesController.js");
const authenticate = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes for Employees and Admins to manage their leave requests
router.post("/submit", authorizeRoles("user", "admin", "supervisor", "superadmin"), submitLeaveRequest);
router.get("/my", authorizeRoles("user", "admin", "supervisor", "superadmin"), getUserLeaves);

// Routes for Approvers (Admins and Supervisors) to manage leave requests
router.get("/pending", authorizeRoles("admin", "supervisor", "superadmin"), getPendingLeavesForApprover);
router.get("/", authorizeRoles("admin", "supervisor", "superadmin"), getLeavesForApprover);
router.put("/:id/approve", authorizeRoles("admin", "supervisor", "superadmin"), approveLeave);
router.put("/:id/reject", authorizeRoles("admin", "supervisor", "superadmin"), rejectLeave);

// Additional Route: Get Approvers within the same company
router.get("/approvers", authorizeRoles("user", "admin", "supervisor", "superadmin"), getApprovers);

module.exports = router;
