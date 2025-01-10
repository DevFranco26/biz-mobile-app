// server/models/SubscriptionPlan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  planName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rangeOfUsers: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1'
  },
  price: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0.00
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'SubscriptionPlans',
  timestamps: true
});

module.exports = SubscriptionPlan;
