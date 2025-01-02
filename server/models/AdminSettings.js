// File: server/models/AdminSettings.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const AdminSettings = sequelize.define('AdminSetting', { // Singular model name
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: { // Changed to camelCase
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'adminid',
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'NO ACTION',
    onDelete: 'CASCADE',
  },
  radius: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  restrictionEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'restrictionenabled',
  },
}, {
  tableName: 'AdminSettings',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = AdminSettings;
