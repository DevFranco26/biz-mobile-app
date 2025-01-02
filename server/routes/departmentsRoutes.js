// File: server/routes/departmentsRoutes.js

const express = require('express');
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment,
  removeUsersFromDepartment,
  getUsersInDepartment
} = require('../controllers/departmentController.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

/**
 * @route   POST /api/departments/create
 * @desc    Create a new Department
 * @access  Admin, SuperAdmin
 */
router.post('/create', authorizeRoles('admin', 'superAdmin'), createDepartment);

/**
 * @route   GET /api/departments/all
 * @desc    Get all Departments
 * @access  Admin, SuperAdmin
 */
router.get('/all', authorizeRoles('admin', 'superAdmin'), getAllDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get Department by ID
 * @access  Admin, SuperAdmin
 */
router.get('/:id', authorizeRoles('admin', 'superAdmin'), getDepartmentById);

/**
 * @route   PUT /api/departments/update/:id
 * @desc    Update Department by ID
 * @access  Admin, SuperAdmin
 */
router.put('/update/:id', authorizeRoles('admin', 'superAdmin'), updateDepartment);

/**
 * @route   DELETE /api/departments/delete/:id
 * @desc    Delete Department by ID
 * @access  Admin, SuperAdmin
 */
router.delete('/delete/:id', authorizeRoles('admin', 'superAdmin'), deleteDepartment);

/**
 * @route   PUT /api/departments/:id/assign-users
 * @desc    Assign Users to Department
 * @access  Admin, SuperAdmin
 */

router.put('/:id/assign-users', authorizeRoles('admin', 'superAdmin', 'supervisor'), assignUsersToDepartment);

/**
 * @route   PUT /api/departments/:id/remove-users
 * @desc    Remove Users from Department
 * @access  Admin, SuperAdmin
 */

router.put('/:id/remove-users', authorizeRoles('admin', 'superAdmin', 'supervisor'), removeUsersFromDepartment);

/**
 * @route   GET /api/departments/:id/users
 * @desc    Get Users in Department
 * @access  Admin, SuperAdmin, Supervisor
 */
router.get('/:id/users', authorizeRoles('admin', 'superAdmin', 'supervisor'), getUsersInDepartment);


module.exports = router;
