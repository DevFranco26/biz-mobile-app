// src/routes/departmentsRoutes.js

import express from 'express';
import { 
  createDepartment, 
  getAllDepartments, 
  getDepartmentById, 
  updateDepartment, 
  deleteDepartment 
} from '../controllers/departmentsController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all department routes
router.use(authenticate);

// Only allow admins or superAdmins to manage departments
router.use(authorizeRoles('admin', 'superAdmin'));

// POST /api/departments - Create a new department
router.post('/', createDepartment);

// GET /api/departments - Get all departments
router.get('/', getAllDepartments);

// GET /api/departments/:id - Get department by ID
router.get('/:id', getDepartmentById);

// PUT /api/departments/:id - Update a department
router.put('/:id', updateDepartment);

// DELETE /api/departments/:id - Delete a department
router.delete('/:id', deleteDepartment);

export default router;
