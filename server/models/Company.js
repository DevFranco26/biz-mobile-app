// File: server/models/Company.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

const Company = sequelize.define('Company', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // Add other attributes as needed
}, {
  tableName: 'Companies',
  timestamps: true,
});

module.exports = Company;
