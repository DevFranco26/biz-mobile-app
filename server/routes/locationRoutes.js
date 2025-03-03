// File: server/routes/locationRoutes.js

const express = require("express");
const { createLocation, getLocations, updateLocation, deleteLocation } = require("../controllers/locationController.js");
const authenticateToken = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

// Apply authentication middleware
router.use(authenticateToken);

// Only allow admins to manage locations
router.use(authorizeRoles("admin", "superadmin"));

router.post("/create", createLocation);
router.get("/all", getLocations);
router.put("/update/:locationId", updateLocation);
router.delete("/delete/:locationId", deleteLocation);

module.exports = router;
