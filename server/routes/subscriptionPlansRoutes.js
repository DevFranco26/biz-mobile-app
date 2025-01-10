// File: server/routes/subscriptionPlansRoutes.js

const express = require('express');
const subscriptionPlansController = require('../controllers/subscriptionPlansController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

/**
 * GET /api/subscription-plans
 * This route is open to ANYONE (no token required).
 * e.g. so prospective new user can view the subscription plans
 */
router.get('/', subscriptionPlansController.getAllPlans);

/**
 * All routes below require authentication & superAdmin role
 */
router.use(authenticate);
router.use(authorizeRoles('superAdmin'));

/**
 * POST /api/subscription-plans (superAdmin only)
 */
router.post('/', subscriptionPlansController.createPlan);

/**
 * PUT /api/subscription-plans/:id (superAdmin only)
 */
router.put('/:id', subscriptionPlansController.updatePlan);

/**
 * DELETE /api/subscription-plans/:id (superAdmin only)
 */
router.delete('/:id', subscriptionPlansController.deletePlan);

module.exports = router;
