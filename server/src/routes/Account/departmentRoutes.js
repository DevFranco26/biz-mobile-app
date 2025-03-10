const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment,
  removeUsersFromDepartment,
  getUsersInDepartment,
} = require("@controllers/Account/departmentController");

router.use(authenticate);
router.post("/create", authorizeRoles("admin", "superadmin"), createDepartment);
router.get("/", authorizeRoles("admin", "superadmin"), getAllDepartments);
router.get("/:id", authorizeRoles("superadmin", "admin", "supervisor", "employee"), getDepartmentById);
router.put("/update/:id", authorizeRoles("admin", "superadmin"), updateDepartment);
router.delete("/delete/:id", authorizeRoles("admin", "superadmin"), deleteDepartment);
router.put("/:id/assign-users", authorizeRoles("admin", "superadmin", "supervisor"), assignUsersToDepartment);
router.put("/:id/remove-users", authorizeRoles("admin", "superadmin", "supervisor"), removeUsersFromDepartment);
router.get("/:id/employees", authorizeRoles("admin", "superadmin", "supervisor"), getUsersInDepartment);

module.exports = router;
