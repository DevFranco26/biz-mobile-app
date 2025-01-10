'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Attempt to remove constraints & indexes by multiple possible names:
    const constraintsToRemove = [
      'SubscriptionPlans_planName_key',
      'planName_unique',
      'planName_key',
      'subscriptionplans_planName_key',
    ];

    for (const name of constraintsToRemove) {
      // removeConstraint
      await queryInterface.removeConstraint('SubscriptionPlans', name)
        .catch(() => { /* ignore if not found */ });
      // removeIndex
      await queryInterface.removeIndex('SubscriptionPlans', name)
        .catch(() => { /* ignore if not found */ });
    }

    // Now add the combined unique index
    await queryInterface.addIndex('SubscriptionPlans', {
      fields: ['planName', 'rangeOfUsers'],
      unique: true,
      name: 'unique_planName_rangeOfUsers'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('SubscriptionPlans', 'unique_planName_rangeOfUsers')
      .catch(() => {});
  }
};
