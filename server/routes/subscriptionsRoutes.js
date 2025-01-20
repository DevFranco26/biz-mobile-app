const express = require('express');
const subscriptionController = require('../controllers/subscriptionController.js');
const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// All these routes require authentication
router.use(authenticate);

/**
 * GET /api/subscriptions/all (superAdmin)
 */
router.get('/all', authorizeRoles('superAdmin'), subscriptionController.getAllSubscriptionsForSuperAdmin);

/**
 * GET /api/subscriptions/current (admin or superAdmin)
 */
router.get('/current', authorizeRoles('admin', 'superAdmin', 'user', 'supervisor'), subscriptionController.getCurrentSubscription);

/**
 * PUT /api/subscriptions/upgrade (admin or superAdmin)
 */
router.put('/upgrade', authorizeRoles('admin', 'superAdmin'), subscriptionController.upgradeSubscription);

/**
 * PUT /api/subscriptions/cancel (admin or superAdmin)
 */
router.put('/cancel', authorizeRoles('admin', 'superAdmin'), subscriptionController.cancelCurrentSubscription);

module.exports = router;
