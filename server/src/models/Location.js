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
    field: 'adminid',
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
    field: 'updatedBy'
  }
}, {
  timestamps: true,
  tableName: 'Locations',
  createdAt: 'createdat',
  updatedAt: 'updatedat',
});

export default Location;
