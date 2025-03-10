// File: src/routes/Features/payrollRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const {
  getMyPayrollRecords,
  getAllPayrollRecords,
  createOrUpdatePayRate,
  updatePayrollSettings,
  getPayrollSettings,
  calculatePayrollForUser,
  generatePayrollPDF,
} = require("@controllers/Features/payrollController");

// All routes require authentication
router.use(authenticate);

// Employee can get their own payroll records
router.get("/my", authorizeRoles("employee", "admin", "superadmin", "supervisor"), getMyPayrollRecords);

// Admin can get all payroll records for the company
router.get("/", authorizeRoles("admin", "superadmin"), getAllPayrollRecords);

// Admin can set a pay rate for an employee
router.post("/payrate/:employeeId", authorizeRoles("admin", "superadmin"), createOrUpdatePayRate);

// Admin can update and view payroll settings
router.put("/settings", authorizeRoles("admin", "superadmin"), updatePayrollSettings);
router.get("/settings", authorizeRoles("admin", "superadmin"), getPayrollSettings);

// Admin can calculate payroll for an employee
router.post("/calculate", authorizeRoles("admin", "superadmin"), calculatePayrollForUser);

// Fetch payroll record for PDF generation (accessible to employee, admin, superadmin)
router.get("/:recordId/pdf", authorizeRoles("employee", "admin", "superadmin"), generatePayrollPDF);

module.exports = router;
