// File: server/models/UserShiftAssignment.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');
const ShiftSchedule = require('./ShiftSchedule.js');
const User = require('./Users.js');

const UserShiftAssignment = sequelize.define('UserShiftAssignment', {
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
  shiftScheduleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ShiftSchedules',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  assignedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'NO ACTION',
  },
  recurrence: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'all',
  },
}, {
  tableName: 'UserShiftAssignments',
  timestamps: true,
});

module.exports = UserShiftAssignment;
