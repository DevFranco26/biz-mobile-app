// File: server/routes/departmentsRoutes.js

const express = require("express");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment,
  removeUsersFromDepartment,
  getUsersInDepartment,
} = require("../controllers/departmentController.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

/**
 * @route   POST /api/departments/create
 * @desc    Create a new Department
 * @access  admin, SuperAdmin
 */
router.post("/create", authorizeRoles("admin", "superadmin"), createDepartment);

/**
 * @route   GET /api/departments/all
 * @desc    Get all Departments
 * @access  admin, SuperAdmin
 */
router.get("/all", authorizeRoles("admin", "superadmin"), getAllDepartments);

/**
 * @route   GET /api/departments/:id
 * @desc    Get Department by ID
 * @access  admin, SuperAdmin
 */
router.get("/:id", authorizeRoles("superadmin", "admin", "supervisor", "user"), getDepartmentById);

/**
 * @route   PUT /api/departments/update/:id
 * @desc    Update Department by ID
 * @access  admin, SuperAdmin
 */
router.put("/update/:id", authorizeRoles("admin", "superadmin"), updateDepartment);

/**
 * @route   DELETE /api/departments/delete/:id
 * @desc    Delete Department by ID
 * @access  admin, SuperAdmin
 */
router.delete("/delete/:id", authorizeRoles("admin", "superadmin"), deleteDepartment);

/**
 * @route   PUT /api/departments/:id/assign-users
 * @desc    Assign Users to Department
 * @access  admin, SuperAdmin
 */

router.put("/:id/assign-users", authorizeRoles("admin", "superadmin", "supervisor"), assignUsersToDepartment);

/**
 * @route   PUT /api/departments/:id/remove-users
 * @desc    Remove Users from Department
 * @access  admin, SuperAdmin
 */

router.put("/:id/remove-users", authorizeRoles("admin", "superadmin", "supervisor"), removeUsersFromDepartment);

/**
 * @route   GET /api/departments/:id/users
 * @desc    Get Users in Department
 * @access  admin, SuperAdmin, supervisor
 */
router.get("/:id/users", authorizeRoles("admin", "superadmin", "supervisor"), getUsersInDepartment);

module.exports = router;
