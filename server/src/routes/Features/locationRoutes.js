// src/routes/Features/locationRoutes.js

const express = require("express");
const router = express.Router();
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");
const { createLocation, getLocations, updateLocation, deleteLocation } = require("@controllers/Features/locationController");

router.post("/create", authenticate, authorizeRoles("admin", "superadmin"), createLocation);
router.get("/all", authenticate, authorizeRoles("admin", "superadmin"), getLocations);
router.put("/update/:locationId", authenticate, authorizeRoles("admin", "superadmin"), updateLocation);
router.delete("/delete/:locationId", authenticate, authorizeRoles("admin", "superadmin"), deleteLocation);

module.exports = router;
