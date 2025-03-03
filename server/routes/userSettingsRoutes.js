// File: server/routes/userSettingsRoutes.js

const express = require("express");
const { assignLocationToUser, toggleLocationRestriction, getUserSettings } = require("../controllers/userSettingsController.js");

const router = express.Router();

// Assign or update user settings
router.post("/assign", assignLocationToUser);

// Toggle location restriction
router.post("/toggle", toggleLocationRestriction);

// Get all user settings
router.get("/all", getUserSettings);

module.exports = router;
