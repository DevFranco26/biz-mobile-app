'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1) DROP old tables if they exist
    await queryInterface.dropTable('SubscriptionPlans', { force: true })
      .catch(() => {/* ignore if doesn't exist */});
    await queryInterface.dropTable('Subscriptions', { force: true })
      .catch(() => {/* ignore if doesn't exist */});

    // 2) CREATE the new "SubscriptionPlans" table from scratch
    await queryInterface.createTable('SubscriptionPlans', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      planName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      rangeOfUsers: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: '1'
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // 3) Make planName+rangeOfUsers unique
    await queryInterface.addIndex('SubscriptionPlans', {
      fields: ['planName', 'rangeOfUsers'],
      unique: true,
      name: 'unique_planName_rangeOfUsers'
    });

    // 4) CREATE the new "Subscriptions" table
    //    If you have references to Company or Plan, define them here
    await queryInterface.createTable('Subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      // foreignKey to the Company table (assuming "companyId" references "Companies(id)")
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Companies', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // foreignKey to the SubscriptionPlans table
      planId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'SubscriptionPlans', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      paymentDateTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expirationDateTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      renewalDateTime: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'canceled', 'expired'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Drop in reverse order
    await queryInterface.dropTable('Subscriptions');
    await queryInterface.dropTable('SubscriptionPlans');
  }
};
