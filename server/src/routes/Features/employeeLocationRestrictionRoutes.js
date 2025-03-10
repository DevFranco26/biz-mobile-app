// File: src/routes/Features/employeeLocationRestrictionRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const {
  assignLocationToEmployee,
  toggleLocationRestriction,
  getEmployeeLocationRestriction,
} = require("@controllers/Features/employeeLocationRestrictionController");

// All routes require authentication
router.use(authenticate);

// Routes for managing employee location restriction (accessible to employee, admin, etc.)
router.post("/assign", assignLocationToEmployee);
router.put("/toggle", toggleLocationRestriction);
router.get("/", getEmployeeLocationRestriction);

module.exports = router;
