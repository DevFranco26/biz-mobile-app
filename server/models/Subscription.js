// File: server/models/Subscription.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

// We'll reference existing models
const Company = require('./Company.js');
const SubscriptionPlan = require('./SubscriptionPlan.js');

const Subscription = sequelize.define('Subscription', {
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'canceled'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'Subscriptions',
  timestamps: true
});

// Create associations here or in index.js. For clarity, we'll do it in index.js

module.exports = Subscription;
