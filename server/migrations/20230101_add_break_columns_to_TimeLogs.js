'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('TimeLogs', 'coffeeBreakStart', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'coffeeBreakEnd', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'lunchBreakStart', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'lunchBreakEnd', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    // You mentioned you might want a 'totalHours' column:
    await queryInterface.addColumn('TimeLogs', 'totalHours', {
      type: Sequelize.DECIMAL(5,2), // e.g., up to 999.99 hours, adjust as needed
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('TimeLogs', 'coffeeBreakStart');
    await queryInterface.removeColumn('TimeLogs', 'coffeeBreakEnd');
    await queryInterface.removeColumn('TimeLogs', 'lunchBreakStart');
    await queryInterface.removeColumn('TimeLogs', 'lunchBreakEnd');
    await queryInterface.removeColumn('TimeLogs', 'totalHours');
  },
};
