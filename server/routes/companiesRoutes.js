// File: server/routes/companiesRoutes.js

const express = require('express');
const { getAllCompanies, createCompany, updateCompany, deleteCompany } = require('../controllers/companiesController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// Apply authentication middleware to all company routes
router.use(authenticate);

// Only allow admins or superAdmins to manage companies
router.use(authorizeRoles('superAdmin'));

// GET /api/companies - Fetch all companies
router.get('/', getAllCompanies);

// POST /api/companies - Create a new company
router.post('/', createCompany);

// PUT /api/companies/:id - Update a company
router.put('/:id', updateCompany);

// DELETE /api/companies/:id - Delete a company
router.delete('/:id', deleteCompany);

module.exports = router;
