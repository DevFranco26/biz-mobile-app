// src/models/UserSettings.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserSettings = sequelize.define('UserSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Define associations elsewhere
  },
  locationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // Define associations elsewhere
  },
  restrictionEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    field: 'restrictionenabled', // Explicitly map to lowercase column
  },
  // ... other fields ...
}, {
  tableName: 'UserSettings', // Ensure correct table name
  timestamps: true,
});

export default UserSettings;
