const express = require('express');
const subscriptionPlansController = require('../controllers/subscriptionPlansController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// All routes below require authentication
router.use(authenticate);

// Only superAdmin can manage subscription plans
router.use(authorizeRoles('superAdmin'));

/**
 * GET /api/subscription-plans
 * Get all subscription plans
 */
router.get('/', subscriptionPlansController.getAllPlans);

/**
 * POST /api/subscription-plans
 * Create a new subscription plan
 */
router.post('/', subscriptionPlansController.createPlan);

/**
 * PUT /api/subscription-plans/:id
 * Update an existing subscription plan
 */
router.put('/:id', subscriptionPlansController.updatePlan);

/**
 * DELETE /api/subscription-plans/:id
 * Delete a subscription plan
 */
router.delete('/:id', subscriptionPlansController.deletePlan);

module.exports = router;
