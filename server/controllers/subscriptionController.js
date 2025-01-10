// File: server/controllers/subscriptionController.js

const { Subscription, SubscriptionPlan, Company } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc  Get All Subscriptions (superAdmin only)
 * @route GET /api/subscriptions/all
 * @access superAdmin
 */
exports.getAllSubscriptionsForSuperAdmin = async (req, res) => {
  try {
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
          attributes: ['id', 'planName', 'rangeOfUsers', 'price', 'features']
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
 * @desc  Get Current Subscription for the Authenticated User's Company
 * @route GET /api/subscriptions/current
 * @access admin, superAdmin
 */
exports.getCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Find an active sub where expirationDateTime > now
    let subscription = await Subscription.findOne({
      where: {
        companyId,
        status: 'active',
        expirationDateTime: { [Op.gt]: new Date() }
      },
      include: [{ model: SubscriptionPlan, as: 'plan' }]
    });

    // If none found, create a free sub on the fly
    if (!subscription) {
      const freePlan = await SubscriptionPlan.findOne({
        where: { planName: 'Free', rangeOfUsers: '1' }
      });
      if (!freePlan) {
        return res.status(500).json({
          message: 'No Free plan found. Please ensure a free plan is seeded.'
        });
      }
      const now = new Date();
      const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // Create subscription
      subscription = await Subscription.create({
        companyId,
        planId: freePlan.id,
        paymentMethod: null,
        paymentDateTime: now,
        expirationDateTime: expiration,
        renewalDateTime: expiration,
        status: 'active'
      });

      // Re-fetch with plan
      subscription = await Subscription.findByPk(subscription.id, {
        include: [{ model: SubscriptionPlan, as: 'plan' }]
      });
    }

    return res.status(200).json({
      message: 'Current subscription retrieved',
      data: subscription
    });
  } catch (error) {
    console.error('Error in getCurrentSubscription:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc  Upgrade or Create a Subscription (30 days)
 * @route PUT /api/subscriptions/upgrade
 * @access admin, superAdmin
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { planId, paymentMethod } = req.body; // optional paymentMethod

    // Validate plan
    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan) {
      return res.status(400).json({ message: 'Invalid subscription plan ID.' });
    }

    // 1) Cancel any existing active subscription
    await Subscription.update(
      { status: 'canceled' },
      {
        where: {
          companyId,
          status: 'active',
          expirationDateTime: { [Op.gt]: new Date() }
        }
      }
    );

    // 2) Create a new subscription record
    const now = new Date();
    const expiration = new Date(now.getTime() + 30*24*60*60*1000);

    const newSubscription = await Subscription.create({
      companyId,
      planId: plan.id,
      paymentMethod: paymentMethod || null,
      paymentDateTime: now,
      expirationDateTime: expiration,
      renewalDateTime: expiration,
      status: 'active'
    });

    return res.status(201).json({
      message: 'Subscription upgraded successfully.',
      data: newSubscription
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc  Cancel current active subscription => revert to Free
 * @route PUT /api/subscriptions/cancel
 * @access admin, superAdmin
 */
exports.cancelCurrentSubscription = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // 1) find the active subscription
    const currentSub = await Subscription.findOne({
      where: {
        companyId,
        status: 'active',
        expirationDateTime: { [Op.gt]: new Date() }
      }
    });

    if (!currentSub) {
      return res.status(404).json({ message: 'No active subscription to cancel.' });
    }

    // 2) set old sub to canceled
    await currentSub.update({ status: 'canceled' });

    // 3) Revert to Free plan automatically
    const freePlan = await SubscriptionPlan.findOne({
      where: { planName: 'Free', rangeOfUsers: '1' }
    });
    if (!freePlan) {
      return res.status(500).json({ message: 'No free plan found. Could not revert.' });
    }

    const now = new Date();
    const expiration = new Date(now.getTime() + 30*24*60*60*1000);

    const newFreeSub = await Subscription.create({
      companyId,
      planId: freePlan.id,
      paymentMethod: null,
      paymentDateTime: now,
      expirationDateTime: expiration,
      renewalDateTime: expiration,
      status: 'active'
    });

    return res.status(200).json({
      message: 'Subscription canceled, reverted to Free plan.',
      data: newFreeSub
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
