'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * 1) If you already have an existing "SubscriptionPlans" table with columns:
     *    - name
     *    - price
     *    - features
     *    - ...
     *    we can rename them or drop them.
     *
     * 2) Otherwise, if your table is brand new, we might just CREATE it. 
     *    But let's assume you already have "SubscriptionPlans" and we just need new columns.
     */

    // Example approach:
    //  -- Rename "name" -> "planName"
    //  -- Remove "maxUsers"
    //  -- Create "rangeOfUsers" column
    //  -- Keep "price" if it already exists, or create it if not
    //  -- Keep "features" if it already exists
    //  -- Possibly keep "description" if it already exists or create it

    // 1. Check if the "SubscriptionPlans" table exists or not
    //    We'll just run queries that won't fail if the column doesn't exist.

    // Rename column "name" -> "planName" (if "name" exists)
    await queryInterface.renameColumn('SubscriptionPlans', 'name', 'planName')
      .catch(() => { 
        // If old column "name" doesn't exist, do nothing
      });

    // Remove "maxUsers" if it exists
    await queryInterface.removeColumn('SubscriptionPlans', 'maxUsers')
      .catch(() => { 
        // If old column "maxUsers" didn't exist, ignore
      });

    // 2. Add "rangeOfUsers" column if it doesn't exist
    await queryInterface.addColumn('SubscriptionPlans', 'rangeOfUsers', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: '1'  // so existing rows won't break
    }).catch(() => { 
      // If it already existed, ignore
    });

    // 3. Ensure "planName" column is NOT NULL
    await queryInterface.changeColumn('SubscriptionPlans', 'planName', {
      type: Sequelize.STRING,
      allowNull: false
    }).catch(() => {
      // If we can't do that, ignore
    });

    // 4. price column: 
    // If it doesn't exist, create it. If it does, ensure decimal(10,2).
    await queryInterface.addColumn('SubscriptionPlans', 'price', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    }).catch(() => { 
      // If column exists, we can alter it to decimal(10,2) 
      // or ignore if it's already correct
    });

    // 5. description column
    await queryInterface.addColumn('SubscriptionPlans', 'description', {
      type: Sequelize.TEXT,
      allowNull: true
    }).catch(() => {});

    // 6. features column
    await queryInterface.addColumn('SubscriptionPlans', 'features', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {}
    }).catch(() => {});

    // 7. (Optional) create a unique index on (planName, rangeOfUsers)
    try {
      await queryInterface.addIndex('SubscriptionPlans', {
        fields: ['planName', 'rangeOfUsers'],
        unique: true,
        name: 'unique_planname_rangeofusers'
      });
    } catch (err) {
      // might already exist or fail
    }
  },

  async down (queryInterface, Sequelize) {
    // revert steps if you want to drop columns:
    // e.g. rename "planName" back to "name"
    // remove "rangeOfUsers", remove "price" if your old schema didn't have them
    await queryInterface.removeIndex('SubscriptionPlans', 'unique_planname_rangeofusers')
      .catch(() => {});

    await queryInterface.removeColumn('SubscriptionPlans', 'rangeOfUsers')
      .catch(() => {});

    await queryInterface.removeColumn('SubscriptionPlans', 'price')
      .catch(() => {});

    await queryInterface.removeColumn('SubscriptionPlans', 'description')
      .catch(() => {});

    await queryInterface.removeColumn('SubscriptionPlans', 'features')
      .catch(() => {});

    // Optionally rename planName -> name
    // ...
  }
};
