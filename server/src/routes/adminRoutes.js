// File: src/routes/adminRoutes.js
import express from 'express';
import { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../controllers/usersController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all admin routes
router.use(authMiddleware);

// Only allow admins or superAdmins to manage users
// Adjust roles as needed.
router.get('/users', authorizeRoles('admin', 'superAdmin'), getAllUsers);
router.post('/users', authorizeRoles('admin', 'superAdmin'), createUser);
router.put('/users/:id', authorizeRoles('admin', 'superAdmin'), updateUser);
router.delete('/users/:id', authorizeRoles('admin', 'superAdmin'), deleteUser);

export default router;
