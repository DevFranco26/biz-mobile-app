// File: server/models/Department.js

const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database.js'); // Adjust the path if necessary

class Department extends Model {}

Department.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Companies', // Ensure this matches your Companies table name
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    supervisorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users', // Ensure this matches your Users table name
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'Department',
    tableName: 'Departments',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'companyId'],
        name: 'unique_department_name_per_company',
      },
    ],
  }
);

module.exports = Department;
