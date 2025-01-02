// File: server/models/Leave.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

// Define the Leave model
const Leave = sequelize.define('Leave', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: { // The user requesting the leave
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', // Ensure this matches the actual table name
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  approverId: { 
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL', 
  },
  type: {
    type: DataTypes.ENUM(
      'Sick Leave',
      'Vacation Leave',
      'Emergency Leave',
      'Maternity/Paternity Leave',
      'Casual Leave'
    ),
    allowNull: false,
    defaultValue: 'Sick Leave',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  fromDate: {
    type: DataTypes.DATE, // Changed from DATEONLY to DATE
    allowNull: false,
    validate: {
      isDate: {
        msg: 'From Date must be a valid date.',
      },
      notEmpty: {
        msg: 'From Date is required.',
      },
      isAfterFromDate(value) {
        if (new Date(value) < new Date(this.fromDate)) {
          throw new Error('From Date must be on or before To Date.');
        }
      },
    },
  },
  toDate: {
    type: DataTypes.DATE, // Changed from DATEONLY to DATE
    allowNull: false,
    validate: {
      isDate: {
        msg: 'To Date must be a valid date.',
      },
      notEmpty: {
        msg: 'To Date is required.',
      },
      isAfterFromDate(value) {
        if (new Date(value) < new Date(this.fromDate)) {
          throw new Error('To Date must be on or after From Date.');
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
    allowNull: false,
    defaultValue: 'Pending',
  },
  rejectionReason: { // Only applicable if status is 'Rejected'
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [10, 1000],
        msg: 'Rejection reason must be between 10 and 1000 characters.',
      },
    },
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Companies',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'Leaves',
  timestamps: true, 
});

module.exports = Leave;
