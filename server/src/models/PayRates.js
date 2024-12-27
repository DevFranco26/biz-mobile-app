import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const PayRates = sequelize.define('PayRates', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  payType: {
    type: DataTypes.STRING, // 'hourly' or 'monthly'
    allowNull: false,
    defaultValue: 'hourly',
  },
  rate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
}, {
  tableName: 'PayRates',
  timestamps: true,
});

export default PayRates;
