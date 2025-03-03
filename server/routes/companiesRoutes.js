// File: server/routes/companiesRoutes.js

const express = require("express");
const {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUserCount,
} = require("../controllers/companiesController.js");
const authenticate = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

// Apply authentication middleware to all company routes
router.use(authenticate);

/**
 * @route   GET /api/companies/all
 * @desc    Get all Companies
 * @access  superadmin
 */
router.get("/all", authorizeRoles("superadmin"), getAllCompanies);

/**
 * @route   GET /api/companies/:id
 * @desc    Get Company by ID
 * @access  superadmin, admin, supervisor, user
 */
router.get("/:id", authorizeRoles("superadmin", "admin", "supervisor", "user"), getCompanyById);

/**
 * @route   POST /api/companies/create
 * @desc    Create a new Company
 * @access  superadmin
 */
router.post("/create", authorizeRoles("superadmin"), createCompany);

/**
 * @route   PUT /api/companies/update/:id
 * @desc    Update a Company by ID
 * @access  superadmin
 */
router.put("/update/:id", authorizeRoles("superadmin"), updateCompany);

/**
 * @route   DELETE /api/companies/delete/:id
 * @desc    Delete a Company by ID
 * @access  superadmin
 */
router.delete("/delete/:id", authorizeRoles("superadmin"), deleteCompany);

/**
 * @route   GET /api/companies/:id/user-count
 * @desc    Get the user count for a company
 * @access  superadmin
 */
router.get("/:id/user-count", authorizeRoles("superadmin", "admin", "supervisor"), getCompanyUserCount);

module.exports = router;
