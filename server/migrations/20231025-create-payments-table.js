'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      // Basic Stripe info
      chargeId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      amount: {
        type: Sequelize.BIGINT, // typically in "cents"
        allowNull: false,
      },
      amountCaptured: {
        type: Sequelize.BIGINT,
        allowNull: true,
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      chargeStatus: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdTimestamp: {
        type: Sequelize.DATE,
        allowNull: false, // date/time from Stripe, converted to normal date
      },
      receiptUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      billingDetails: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      shippingDetails: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      balanceTransactionId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      chargeDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paymentOutcome: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      paymentIntentId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      receiptEmail: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // Stripe's request id + idempotency, if present
      requestId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      idempotencyKey: {
        type: Sequelize.STRING,
        allowNull: true,
      },

      // e.g. 'charge.succeeded'
      eventType: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      // If you want to store a reference to the subscription record
      subscriptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // If you want to store a reference to the company
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Companies',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },

      // Timestamps
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  },
};
