import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js'; // sequelize instance

const Company = sequelize.define('Company', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true, // Enforces uniqueness of the company domain
  }
});

export default Company;
