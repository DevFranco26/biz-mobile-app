// File: server/routes/shiftSchedulesRoutes.js

const express = require('express');
const {
  getAllShiftSchedules,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
  assignShiftToUser,
  getMyShifts,
  deleteUserFromShift 
} = require('../controllers/shiftScheduleController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

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

module.exports = router;
