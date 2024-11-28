import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const TimeLogs = sequelize.define('TimeLogs', {
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
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  timeInDevice: {
    type: DataTypes.JSON,  // Use JSON data type to store device info
    allowNull: true,
  },
  timeOutDevice: {
    type: DataTypes.JSON,  // Use JSON data type to store device info
    allowNull: true,
  },
  timeInLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  timeOutLocation: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default TimeLogs;
