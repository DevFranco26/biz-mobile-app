// File: src/routes/Features/employeeRoutes.js
const express = require("express");
const router = express.Router();
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const authenticate = require("@middlewares/authMiddleware");
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeePresence,
  changeEmployeePassword,
  getEmployeeById,
} = require("@controllers/Features/employeeController");

// All routes require authentication
router.use(authenticate);

// Viewing employees: accessible to admin, superadmin, and supervisor
router.get("/", authorizeRoles("admin", "superadmin", "supervisor"), getAllEmployees);

// Manage employees: only admin and superadmin
router.post("/", authorizeRoles("admin", "superadmin"), createEmployee);
router.put("/:id", authorizeRoles("admin", "superadmin"), updateEmployee);
router.delete("/:id", authorizeRoles("admin", "superadmin"), deleteEmployee);

// Update current employee's presence and password (self-service)
router.put("/me/presence", updateEmployeePresence);
router.put("/me/password", changeEmployeePassword);

// Retrieve employee details
router.get("/:id/detail", authorizeRoles("employee", "admin", "superadmin", "supervisor"), getEmployeeById);

module.exports = router;
