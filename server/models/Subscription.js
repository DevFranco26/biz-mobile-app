// server/models/Subscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false
    // references, etc. if needed
  },
  planId: {
    type: DataTypes.INTEGER,
    allowNull: false
    // references, etc. if needed
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  paymentDateTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expirationDateTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  renewalDateTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'canceled', 'expired'),
    allowNull: false,
    defaultValue: 'active'
  }
}, {
  tableName: 'Subscriptions',
  timestamps: true
});

module.exports = Subscription;
