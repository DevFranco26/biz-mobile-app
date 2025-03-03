// File: server/routes/subscriptionPlansRoutes.js

const express = require("express");
const subscriptionPlansController = require("../controllers/subscriptionPlansController.js");
const authenticate = require("../middlewares/authMiddleware.js");
const { authorizeRoles } = require("../middlewares/roleMiddleware.js");

const router = express.Router();

/**
 * GET /api/subscription-plans
 * This route is open to ANYONE (no token required).
 * e.g. so prospective new user can view the subscription plans
 */
router.get("/", subscriptionPlansController.getAllPlans);

/**
 * All routes below require authentication & superadmin role
 */
router.use(authenticate);
router.use(authorizeRoles("superadmin"));

/**
 * POST /api/subscription-plans (superadmin only)
 */
router.post("/", subscriptionPlansController.createPlan);

/**
 * PUT /api/subscription-plans/:id (superadmin only)
 */
router.put("/:id", subscriptionPlansController.updatePlan);

/**
 * DELETE /api/subscription-plans/:id (superadmin only)
 */
router.delete("/:id", subscriptionPlansController.deletePlan);

module.exports = router;
