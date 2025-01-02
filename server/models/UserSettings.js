// File: server/models/UserSettings.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const UserSettings = sequelize.define('UserSettings', {
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
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Locations',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  restrictionEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'restrictionenabled', // Explicitly map to lowercase column
  },

}, {
  tableName: 'UserSettings',
  timestamps: true,
});

module.exports = UserSettings;
