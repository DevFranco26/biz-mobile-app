const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  chargeId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  amountCaptured: {
    type: DataTypes.BIGINT,
    allowNull: true,
  },
  currency: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chargeStatus: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdTimestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  receiptUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  billingDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  shippingDetails: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  balanceTransactionId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  chargeDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  paymentOutcome: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  paymentIntentId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  receiptEmail: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  requestId: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  idempotencyKey: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'Payments',
  timestamps: true,
});

module.exports = Payment;
