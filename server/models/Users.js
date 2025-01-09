// File: server/models/Users.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: 'Users_email_key', 
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('superAdmin', 'admin', 'supervisor', 'user'),
    defaultValue: 'user',
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  middleName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  lastName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  status: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Companies',
      key: 'id',
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  },
  presenceStatus: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'offline',
  },
  lastActiveAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  rateType: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'hourly',
  },
  rateValue: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'Users',
  timestamps: true,
});

module.exports = User;
