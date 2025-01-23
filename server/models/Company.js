const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.js');

class Company extends Model {}

Company.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD', 
    },
    language: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'en',
    },
  },
  {
    sequelize,
    modelName: 'Company',
    tableName: 'Companies',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'domain'],
        name: 'unique_company_name_domain',
      },
    ],
  }
);

module.exports = Company;
