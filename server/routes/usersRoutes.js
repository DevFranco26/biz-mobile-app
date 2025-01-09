// File: server/routes/usersRoutes.js

const express = require('express');
const { 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser,
  updateUserPresence,
  changeUserPassword,
  getUserById 
} = require('../controllers/usersController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

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
router.put('/me/password', changeUserPassword);

// New route to fetch a single user's details
router.get('/:id/detail', authorizeRoles('user', 'admin', 'superAdmin', 'supervisor'), getUserById);

module.exports = router;
