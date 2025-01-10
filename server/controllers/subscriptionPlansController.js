// File: server/controllers/subscriptionPlansController.js

const { SubscriptionPlan } = require('../models');
const { Op } = require('sequelize');

exports.getAllPlans = async (req, res) => {
  try {
    // Sort them by price or planName, your call
    const plans = await SubscriptionPlan.findAll({
      order: [['planName', 'ASC']]
    });
    res.status(200).json({
      message: 'Subscription plans retrieved successfully.',
      data: plans
    });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    // The front-end should pass planName, rangeOfUsers, price, etc.
    const { planName, rangeOfUsers, price, description, features } = req.body;

    // Check for existing row with same (planName, rangeOfUsers)
    const existing = await SubscriptionPlan.findOne({
      where: { planName, rangeOfUsers }
    });
    if (existing) {
      return res.status(400).json({
        message: `Plan with planName="${planName}" and rangeOfUsers="${rangeOfUsers}" already exists.`
      });
    }

    const newPlan = await SubscriptionPlan.create({
      planName,
      rangeOfUsers,
      price: price || 0,
      description: description || '',
      features: features || {}
    });

    res.status(201).json({
      message: 'Subscription plan created successfully.',
      data: newPlan
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { planName, rangeOfUsers, price, description, features } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // If planName/rangeOfUsers changes, ensure no duplicates
    if ((planName && planName !== plan.planName) ||
        (rangeOfUsers && rangeOfUsers !== plan.rangeOfUsers)) {
      const exists = await SubscriptionPlan.findOne({
        where: {
          planName: planName || plan.planName,
          rangeOfUsers: rangeOfUsers || plan.rangeOfUsers,
          id: { [Op.ne]: id }
        }
      });
      if (exists) {
        return res.status(400).json({
          message: 'Another plan with that planName + rangeOfUsers already exists.'
        });
      }
    }

    await plan.update({
      planName: planName !== undefined ? planName : plan.planName,
      rangeOfUsers: rangeOfUsers !== undefined ? rangeOfUsers : plan.rangeOfUsers,
      price: price !== undefined ? price : plan.price,
      description: description !== undefined ? description : plan.description,
      features: features !== undefined ? features : plan.features
    });

    res.status(200).json({
      message: 'Subscription plan updated successfully.',
      data: plan
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // optional: check if plan in use by active subscription

    await plan.destroy();
    res.status(200).json({
      message: 'Subscription plan deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
