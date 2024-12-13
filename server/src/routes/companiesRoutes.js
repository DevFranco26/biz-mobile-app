// src/routes/companiesRoutes.js

import express from 'express';
import { getAllCompanies, createCompany, updateCompany, deleteCompany } from '../controllers/companiesController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all company routes
router.use(authenticate);

// Only allow admins or superAdmins to manage companies
router.use(authorizeRoles('admin', 'superAdmin'));

// GET /api/companies - Fetch all companies
router.get('/', getAllCompanies);

// POST /api/companies - Create a new company
router.post('/', createCompany);

// PUT /api/companies/:id - Update a company
router.put('/:id', updateCompany);

// DELETE /api/companies/:id - Delete a company
router.delete('/:id', deleteCompany);

export default router;
