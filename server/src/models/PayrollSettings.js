// File: server/src/models/PayrollSettings.js

import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PayrollSettings = sequelize.define('PayrollSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  companyId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'Companies', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  cutoffCycle: {
    type: DataTypes.ENUM('daily','weekly','bi-weekly','monthly'),
    defaultValue: 'bi-weekly',
    allowNull: false,
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD',
  },
  overtimeRate: {
    type: DataTypes.DECIMAL(10,2),
    defaultValue: 1.5,
  },
}, {
  tableName: 'PayrollSettings',
  timestamps: true,
});

export default PayrollSettings;
