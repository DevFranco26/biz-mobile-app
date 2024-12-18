// src/routes/usersRoutes.js

import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  updateUserPresence // Add this line
} from '../controllers/usersController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all user routes
router.use(authenticate);

// Only allow admins, superAdmins, and supervisors to view users
router.get('/', authorizeRoles('admin', 'superAdmin', 'supervisor'), getAllUsers);

// Only allow admins and superAdmins to manage users
router.post('/', authorizeRoles('admin', 'superAdmin'), createUser);
router.put('/:id', authorizeRoles('admin', 'superAdmin'), updateUser);
router.delete('/:id', authorizeRoles('admin', 'superAdmin'), deleteUser);

// New route to update the current user's presence
router.put('/me/presence', updateUserPresence);

export default router;
