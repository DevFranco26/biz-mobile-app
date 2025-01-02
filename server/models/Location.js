// File: server/models/Location.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'adminid',
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10,8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11,8),
    allowNull: false,
  },
  radius: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 100,
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updatedBy',
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  }
}, {
  tableName: 'Locations',
  timestamps: true,
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

module.exports = Location;
