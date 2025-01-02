// File: migrations/20250102075441-alter-user-settings-fk.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove existing foreign key constraint
    await queryInterface.removeConstraint('UserSettings', 'UserSettings_userId_fkey');

    // Add new foreign key constraint with ON DELETE CASCADE
    await queryInterface.addConstraint('UserSettings', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'UserSettings_userId_fkey', // Ensure this matches the existing constraint name
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new foreign key constraint
    await queryInterface.removeConstraint('UserSettings', 'UserSettings_userId_fkey');

    // Re-add the original foreign key constraint without ON DELETE CASCADE
    await queryInterface.addConstraint('UserSettings', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'UserSettings_userId_fkey',
      references: {
        table: 'Users',
        field: 'id',
      },
      onDelete: 'SET NULL', // Or your original setting
      onUpdate: 'CASCADE',
    });
  }
};
