// File: server/routes/companiesRoutes.js

const express = require('express');
const {
  getAllCompanies,
  getCompanyById,   // <--- Import the new function
  createCompany,
  updateCompany,
  deleteCompany,
} = require('../controllers/companiesController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// Apply authentication middleware to all company routes
router.use(authenticate);

/**
 * @route   GET /api/companies/all
 * @desc    Get all Companies
 * @access  superAdmin
 */
router.get(
  '/all',
  authorizeRoles('superAdmin'),
  getAllCompanies
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get Company by ID
 * @access  superAdmin
 */
router.get(
  '/:id',
  authorizeRoles('superAdmin', 'admin', 'supervisor', 'user'),
  getCompanyById
);

/**
 * @route   POST /api/companies/create
 * @desc    Create a new Company
 * @access  superAdmin
 */
router.post(
  '/create',
  authorizeRoles('superAdmin'),
  createCompany
);

/**
 * @route   PUT /api/companies/update/:id
 * @desc    Update a Company by ID
 * @access  superAdmin
 */
router.put(
  '/update/:id',
  authorizeRoles('superAdmin'),
  updateCompany
);

/**
 * @route   DELETE /api/companies/delete/:id
 * @desc    Delete a Company by ID
 * @access  superAdmin
 */
router.delete(
  '/delete/:id',
  authorizeRoles('superAdmin'),
  deleteCompany
);

module.exports = router;
