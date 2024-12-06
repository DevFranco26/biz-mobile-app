// src/models/Location.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'adminid', // Map to lowercase column
    // Define associations elsewhere
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
    defaultValue: 100, // meters
  },
}, {
  timestamps: true,
  tableName: 'Locations',
  createdAt: 'createdat', // Map to lowercase column
  updatedAt: 'updatedat', // Map to lowercase column
});

export default Location;
