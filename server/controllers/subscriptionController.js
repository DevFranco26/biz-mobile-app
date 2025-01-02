// File: server/controllers/subscriptionController.js

const { Subscription, SubscriptionPlan, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get All Subscriptions (superAdmin only)
 * @route   GET /api/subscriptions/all
 * @access  superAdmin
 */
exports.getAllSubscriptionsForSuperAdmin = async (req, res) => {
  try {
    // Retrieve all subscriptions, including the associated Company & Plan
    const subscriptions = await Subscription.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'domain']
        },
        {
          model: SubscriptionPlan,
          as: 'plan',
          attributes: ['id', 'name', 'price', 'maxUsers', 'features']
        }
      ]
    });

    res.status(200).json({
      message: 'All subscriptions retrieved successfully.',
      data: subscriptions
    });
  } catch (error) {
    console.error('Error in getAllSubscriptionsForSuperAdmin:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Get Current Subscription for the Authenticated User's Company
 * @route   GET /api/subscriptions/current
 * @access  admin, superAdmin
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const subscription = await Subscription.findOne({
      where: {
        companyId,
        status: 'active',
        startDate: { [Op.lte]: new Date() },
        endDate: { [Op.gte]: new Date() }
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    if (!subscription) {
      return res
        .status(404)
        .json({ message: 'No active subscription found for your company.' });
    }

    res.status(200).json({
      message: 'Active subscription retrieved.',
      data: subscription
    });
  } catch (error) {
    console.error('Error getting current subscription:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Upgrade or Create a Subscription
 *          - startDate = now
 *          - endDate = now + 30 days
 * @route   PUT /api/subscriptions/upgrade
 * @access  admin, superAdmin
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { planId } = req.body;

    // Validate plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      return res.status(400).json({ message: 'Invalid subscription plan ID.' });
    }

    // Generate startDate = now, endDate = 30 days from now
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Check for existing active subscription
    let existingSubscription = await Subscription.findOne({
      where: {
        companyId,
        status: 'active',
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (existingSubscription) {
      // If an active subscription is found, update it (upgrade/downgrade)
      await existingSubscription.update({
        planId,
        startDate,
        endDate,
        status: 'active'
      });

      return res.status(200).json({
        message: 'Subscription upgraded successfully.',
        data: existingSubscription
      });
    }

    // If no active subscription, create a new one
    const newSubscription = await Subscription.create({
      companyId,
      planId,
      startDate,
      endDate,
      status: 'active'
    });

    res.status(201).json({
      message: 'New subscription created successfully.',
      data: newSubscription
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Cancel current active subscription immediately
 * @route   PUT /api/subscriptions/cancel
 * @access  admin, superAdmin
 */
exports.cancelCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Find the active subscription for this company
    const existingSubscription = await Subscription.findOne({
      where: {
        companyId,
        status: 'active',
        endDate: { [Op.gte]: new Date() }
      }
    });

    if (!existingSubscription) {
      return res.status(404).json({
        message: 'No active subscription to cancel.'
      });
    }

    // Hard-cancel immediately: set status to 'canceled' and endDate to now
    await existingSubscription.update({
      status: 'canceled',
      endDate: new Date()
    });

    return res.status(200).json({
      message: 'Subscription canceled successfully.',
      data: existingSubscription
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
