// File: server/routes/leavesRoutes.js

const express = require('express');
const {
  submitLeaveRequest,
  getUserLeaves,
  getPendingLeavesForApprover,
  approveLeave,
  rejectLeave,
  getApprovers,
  getLeavesForApprover,
} = require('../controllers/leavesController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Routes for Employees and Admins to manage their leave requests
router.post('/submit', authorizeRoles('user', 'admin', 'supervisor'), submitLeaveRequest);
router.get('/my', authorizeRoles('user', 'admin', 'supervisor'), getUserLeaves);

// Routes for Approvers (Admins and Supervisors) to manage leave requests
router.get('/pending', authorizeRoles('admin', 'supervisor'), getPendingLeavesForApprover);
router.get('/', authorizeRoles('admin', 'supervisor'), getLeavesForApprover);
router.put('/:id/approve', authorizeRoles('admin', 'supervisor'), approveLeave);
router.put('/:id/reject', authorizeRoles('admin', 'supervisor'), rejectLeave);

// Additional Route: Get Approvers within the same company
router.get('/approvers', authorizeRoles('user', 'admin', 'supervisor'), getApprovers);

module.exports = router;
