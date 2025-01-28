// File: server/models/TimeLogs.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const TimeLogs = sequelize.define('TimeLogs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  // We replaced old date/time columns with this:
  timeInAt: {
    type: DataTypes.DATE, // TIMESTAMP WITH TIME ZONE in PG
    allowNull: true,
  },
  timeOutAt: {
    type: DataTypes.DATE, // TIMESTAMP WITH TIME ZONE in PG
    allowNull: true,
  },

  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },

  timeInDevice: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  timeOutDevice: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  timeInLat: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  timeInLong: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  timeOutLat: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  timeOutLong: { type: DataTypes.DECIMAL(11, 8), allowNull: true },

  // Keep your coffee/lunch breaks as is:
  coffeeBreakStart: { type: DataTypes.DATE, allowNull: true },
  coffeeBreakEnd: { type: DataTypes.DATE, allowNull: true },
  coffeeBreak2Start: { type: DataTypes.DATE, allowNull: true },
  coffeeBreak2End: { type: DataTypes.DATE, allowNull: true },
  lunchBreakStart: { type: DataTypes.DATE, allowNull: true },
  lunchBreakEnd: { type: DataTypes.DATE, allowNull: true },

  totalHours: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
}, {
  tableName: 'TimeLogs',
  timestamps: true,
});

module.exports = TimeLogs;
