'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Companies', 'country', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'USA', // You can set a default or handle it in your application
    });
    await queryInterface.addColumn('Companies', 'currency', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'USD',
    });
    await queryInterface.addColumn('Companies', 'language', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'en',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Companies', 'country');
    await queryInterface.removeColumn('Companies', 'currency');
    await queryInterface.removeColumn('Companies', 'language');
  },
};
