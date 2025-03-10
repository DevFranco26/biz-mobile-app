// File: src/routes/Features/leavesRoutes.js
const express = require("express");
const router = express.Router();
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const authenticate = require("@middlewares/authMiddleware");
const {
  submitLeaveRequest,
  getUserLeaves,
  getPendingLeavesForApprover,
  approveLeave,
  rejectLeave,
  getApprovers,
  getLeavesForApprover,
} = require("@controllers/Features/leaveController");

// All routes require authentication
router.use(authenticate);

// Employees (and higher) can submit and view their leaves
router.post("/submit", authorizeRoles("employee", "admin", "supervisor", "superadmin"), submitLeaveRequest);
router.get("/my", authorizeRoles("employee", "admin", "supervisor", "superadmin"), getUserLeaves);

// Approvers (admin, supervisor, superadmin) manage leave requests
router.get("/pending", authorizeRoles("admin", "supervisor", "superadmin"), getPendingLeavesForApprover);
router.get("/", authorizeRoles("admin", "supervisor", "superadmin"), getLeavesForApprover);
router.put("/:id/approve", authorizeRoles("admin", "supervisor", "superadmin"), approveLeave);
router.put("/:id/reject", authorizeRoles("admin", "supervisor", "superadmin"), rejectLeave);

// Additional route: Get approvers within the same company
router.get("/approvers", authorizeRoles("employee", "admin", "supervisor", "superadmin"), getApprovers);

module.exports = router;
