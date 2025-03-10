// File: src/routes/Features/locationRoutes.js
const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const { createLocation, getLocations, updateLocation, deleteLocation } = require("@controllers/Features/locationController");

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorizeRoles("admin", "superadmin"));

router.post("/create", createLocation);
router.get("/all", getLocations);
router.put("/update/:locationId", updateLocation);
router.delete("/delete/:locationId", deleteLocation);

module.exports = router;
