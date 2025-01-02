// File: server/models/SubscriptionPlan.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0
  },
  maxUsers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  features: {
    // Store feature flags or additional details
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'SubscriptionPlans',
  timestamps: true
});

module.exports = SubscriptionPlan;
