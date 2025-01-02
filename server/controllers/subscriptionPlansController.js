// File: server/controllers/subscriptionPlansController.js

const { SubscriptionPlan } = require('../models');

exports.getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      order: [['price', 'ASC']]
    });
    res.status(200).json({ message: 'Subscription plans retrieved successfully.', data: plans });
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, description, price, maxUsers, features } = req.body;

    // Check for existing plan
    const existingPlan = await SubscriptionPlan.findOne({ where: { name } });
    if (existingPlan) {
      return res.status(400).json({ message: 'A plan with this name already exists.' });
    }

    const newPlan = await SubscriptionPlan.create({
      name,
      description,
      price,
      maxUsers,
      features
    });

    res.status(201).json({ message: 'Subscription plan created successfully.', data: newPlan });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, maxUsers, features } = req.body;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found.' });
    }

    // If name is changing, check for duplicates
    if (name && name !== plan.name) {
      const duplicateName = await SubscriptionPlan.findOne({ where: { name } });
      if (duplicateName) {
        return res.status(400).json({ message: 'Another plan with this name already exists.' });
      }
    }

    await plan.update({
      name: name || plan.name,
      description: description || plan.description,
      price: price !== undefined ? price : plan.price,
      maxUsers: maxUsers !== undefined ? maxUsers : plan.maxUsers,
      features: features !== undefined ? features : plan.features
    });

    res.status(200).json({ message: 'Subscription plan updated successfully.', data: plan });
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

    // Optional: Check if plan is in use by active subscriptions
    // You can add logic to block deletion if active subscriptions exist

    await plan.destroy();
    res.status(200).json({ message: 'Subscription plan deleted successfully.' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
