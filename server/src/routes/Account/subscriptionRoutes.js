const express = require("express");
const router = express.Router();
const subscriptionController = require("@controllers/Account/subscriptionController");
const authenticate = require("@middlewares/authMiddleware");
const { authorizeRoles } = require("@middlewares/roleMiddleware");

// All routes require authentication.
router.use(authenticate);

// Routes for viewing current subscription, upgrading, and canceling.
router.get("/current", authorizeRoles("admin", "superadmin", "employee", "supervisor"), subscriptionController.getCurrentSubscription);
router.put("/upgrade", authorizeRoles("admin", "superadmin"), subscriptionController.upgradeSubscription);
router.put("/cancel", authorizeRoles("admin", "superadmin"), subscriptionController.cancelCurrentSubscription);

module.exports = router;
