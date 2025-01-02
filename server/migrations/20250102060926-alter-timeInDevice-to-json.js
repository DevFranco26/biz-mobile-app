// File: server/migrations/20250102060926-alter-timeInDevice-to-json.js

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add a temporary column with JSON type
      await queryInterface.addColumn(
        'TimeLogs',
        'timeInDevice_temp',
        {
          type: Sequelize.JSON,
          allowNull: true,
        },
        { transaction }
      );

      // Update the temporary column by casting existing data to JSON
      await queryInterface.sequelize.query(
        `UPDATE "TimeLogs" SET "timeInDevice_temp" = "timeInDevice"::json;`,
        { transaction }
      );

      // Remove the old column
      await queryInterface.removeColumn('TimeLogs', 'timeInDevice', { transaction });

      // Rename the temporary column to timeInDevice
      await queryInterface.renameColumn('TimeLogs', 'timeInDevice_temp', 'timeInDevice', { transaction });
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      // Add a temporary column with original type (assuming TEXT)
      await queryInterface.addColumn(
        'TimeLogs',
        'timeInDevice_temp',
        {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        { transaction }
      );

      // Update the temporary column by casting JSON data back to TEXT
      await queryInterface.sequelize.query(
        `UPDATE "TimeLogs" SET "timeInDevice_temp" = "timeInDevice"::text;`,
        { transaction }
      );

      // Remove the JSON column
      await queryInterface.removeColumn('TimeLogs', 'timeInDevice', { transaction });

      // Rename the temporary column back to timeInDevice
      await queryInterface.renameColumn('TimeLogs', 'timeInDevice_temp', 'timeInDevice', { transaction });
    });
  },
};
