// src/routes/shiftSchedulesRoutes.js

import express from 'express';
import {
  getAllShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
  assignShiftToUser,
  getMyShifts,
  deleteUserFromShift 
} from '../controllers/shiftScheduleController.js';
import authenticate from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// User: Get own shifts
router.get('/my', authorizeRoles('user', 'admin', 'superAdmin', 'supervisor'), getMyShifts);

// Admin/SuperAdmin/Supervisor: Get all shifts
router.get('/', authorizeRoles('admin', 'superAdmin', 'supervisor'), getAllShiftSchedules);

// Admin/SuperAdmin: Create, Update, Delete shifts
router.post('/', authorizeRoles('admin', 'superAdmin'), createShiftSchedule);
router.put('/:id', authorizeRoles('admin', 'superAdmin'), updateShiftSchedule);
router.delete('/:id', authorizeRoles('admin', 'superAdmin'), deleteShiftSchedule);

// Admin/SuperAdmin/Supervisor: Assign shifts to users
router.post('/:id/assign', authorizeRoles('admin', 'superAdmin', 'supervisor'), assignShiftToUser);

// Route to delete a user from a shift
router.delete('/:shiftId/assignments/:userId', authorizeRoles('admin', 'superAdmin'), deleteUserFromShift);

export default router;
