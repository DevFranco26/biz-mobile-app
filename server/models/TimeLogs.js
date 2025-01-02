// File: server/models/TimeLogs.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const TimeLogs = sequelize.define(
  'TimeLogs',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // References are defined in associations
    },
    timeInDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    timeInTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    timeOutDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    timeOutTime: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    timeInTimeZone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    timeOutTimeZone: {
      type: DataTypes.STRING,
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
    timeInLat: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true,
    },
    timeInLong: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true,
    },
    timeOutLat: {
      type: DataTypes.DECIMAL(10,8),
      allowNull: true,
    },
    timeOutLong: {
      type: DataTypes.DECIMAL(11,8),
      allowNull: true,
    },
  },
  {
    tableName: 'TimeLogs',
    timestamps: true,
  }
);

module.exports = TimeLogs;
