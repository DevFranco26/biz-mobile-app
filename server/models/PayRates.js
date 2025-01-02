// File: server/models/PayRates.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const PayRates = sequelize.define('PayRates', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  payType: {
    type: DataTypes.STRING, // 'hourly' or 'monthly'
    allowNull: false,
    defaultValue: 'hourly',
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'PayRates',
  timestamps: true,
});

module.exports = PayRates;
