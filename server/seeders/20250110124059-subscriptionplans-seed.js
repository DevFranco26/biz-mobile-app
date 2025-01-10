'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const plans = [
      // FREE
      {
        planName: 'Free',
        rangeOfUsers: '1',
        price: 0.00,
        description: 'Free plan for single user only',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      // BASIC
      {
        planName: 'Basic',
        rangeOfUsers: '2-9',
        price: 9.99,
        description: 'Basic plan for 2-9 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Basic',
        rangeOfUsers: '10-19',
        price: 39.99,
        description: 'Basic plan for 10-19 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Basic',
        rangeOfUsers: '20-49',
        price: 69.99,
        description: 'Basic plan for 20-49 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Basic',
        rangeOfUsers: '50-99',
        price: 119.99,
        description: 'Basic plan for 50-99 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Basic',
        rangeOfUsers: '100+',
        price: 169.99,
        description: 'Basic plan for 100+ users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      // PRO
      {
        planName: 'Pro',
        rangeOfUsers: '2-9',
        price: 19.99,
        description: 'Pro plan for 2-9 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Pro',
        rangeOfUsers: '10-19',
        price: 49.99,
        description: 'Pro plan for 10-19 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Pro',
        rangeOfUsers: '20-49',
        price: 79.99,
        description: 'Pro plan for 20-49 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Pro',
        rangeOfUsers: '50-99',
        price: 129.99,
        description: 'Pro plan for 50-99 users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      },
      {
        planName: 'Pro',
        rangeOfUsers: '100+',
        price: 179.99,
        description: 'Pro plan for 100+ users',
        features: JSON.stringify({}),
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('SubscriptionPlans', plans);
  },

  async down(queryInterface, Sequelize) {
    // remove the rows we added
    await queryInterface.bulkDelete('SubscriptionPlans', {
      planName: { [Sequelize.Op.in]: ['Free', 'Basic', 'Pro'] }
    });
  }
};
