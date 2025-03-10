const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const { getAllCompanies, getCompanyById, createCompany, updateCompany, deleteCompany } = require("@controllers/Account/companyController");

// Protected routes.
router.use(authenticate);
router.get("/all", authorizeRoles("superadmin"), getAllCompanies);
router.post("/create", authorizeRoles("superadmin"), createCompany);
router.put("/update/:id", authorizeRoles("superadmin"), updateCompany);
router.delete("/delete/:id", authorizeRoles("superadmin"), deleteCompany);
router.get("/:id", authorizeRoles("superadmin", "admin"), getCompanyById);

module.exports = router;
