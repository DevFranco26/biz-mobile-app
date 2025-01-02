// File: server/routes/subscriptionsRoutes.js

const express = require('express');
const subscriptionController = require('../controllers/subscriptionController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/subscriptions/all
 * SuperAdmin sees all subscriptions
 */
router.get(
  '/all',
  authorizeRoles('superAdmin'),
  subscriptionController.getAllSubscriptionsForSuperAdmin
);

/**
 * GET /api/subscriptions/current
 * Admin or SuperAdmin retrieves current subscription of own company
 */
router.get(
  '/current',
  authorizeRoles('admin', 'superAdmin'),
  subscriptionController.getCurrentSubscription
);

/**
 * PUT /api/subscriptions/upgrade
 * Admin or SuperAdmin upgrades (or creates) subscription for own company
 */
router.put(
  '/upgrade',
  authorizeRoles('admin', 'superAdmin'),
  subscriptionController.upgradeSubscription
);

/**
 * PUT /api/subscriptions/cancel
 * Admin or SuperAdmin cancels current subscription immediately
 */
router.put(
  '/cancel',
  authorizeRoles('admin', 'superAdmin'),
  subscriptionController.cancelCurrentSubscription
);

module.exports = router;
