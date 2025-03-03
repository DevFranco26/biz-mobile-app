// File: server/routes/subscriptionsRoutes.js
const express = require("express");
const subscriptionController = require("../controllers/subscriptionController.js");
const authenticate = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");
const router = express.Router();
router.use(authenticate);
router.get("/all", authorizeRoles("superadmin"), subscriptionController.getAllSubscriptionsForSuperAdmin);
router.get("/current", authorizeRoles("admin", "superadmin", "user", "supervisor"), subscriptionController.getCurrentSubscription);
router.put("/upgrade", authorizeRoles("admin", "superadmin"), subscriptionController.upgradeSubscription);
router.put("/cancel", authorizeRoles("admin", "superadmin"), subscriptionController.cancelCurrentSubscription);
module.exports = router;
