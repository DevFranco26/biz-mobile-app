// src/routes/usersRoutes.js

import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/usersController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Only allow admins or superAdmins to manage users
router.get('/', authorizeRoles('admin', 'superAdmin'), getAllUsers);
router.post('/', authorizeRoles('admin', 'superAdmin'), createUser);
router.put('/:id', authorizeRoles('admin', 'superAdmin'), updateUser);
router.delete('/:id', authorizeRoles('admin', 'superAdmin'), deleteUser);

export default router;
