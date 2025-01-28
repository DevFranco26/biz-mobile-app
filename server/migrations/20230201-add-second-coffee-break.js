// 20230201-add-second-coffee-break.js
module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.addColumn('TimeLogs', 'coffeeBreak2Start', {
        type: Sequelize.DATE,
        allowNull: true,
      });
      await queryInterface.addColumn('TimeLogs', 'coffeeBreak2End', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.removeColumn('TimeLogs', 'coffeeBreak2Start');
      await queryInterface.removeColumn('TimeLogs', 'coffeeBreak2End');
    }
  };
  