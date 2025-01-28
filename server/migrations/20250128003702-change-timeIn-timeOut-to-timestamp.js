'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add new columns
    await queryInterface.addColumn('TimeLogs', 'timeInAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'timeOutAt', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // 2. Copy existing data (timeInDate + timeInTime => timeInAt)
    //    We have to be careful about possible NULLs and type casting.
    //    For Postgres, you can do something like:
    await queryInterface.sequelize.query(`
      UPDATE "TimeLogs"
      SET "timeInAt" = 
        CASE
          WHEN "timeInDate" IS NOT NULL AND "timeInTime" IS NOT NULL
            THEN ("timeInDate"::text || ' ' || "timeInTime"::text)::timestamp with time zone
          ELSE NULL
        END
    `);

    await queryInterface.sequelize.query(`
      UPDATE "TimeLogs"
      SET "timeOutAt" =
        CASE
          WHEN "timeOutDate" IS NOT NULL AND "timeOutTime" IS NOT NULL
            THEN ("timeOutDate"::text || ' ' || "timeOutTime"::text)::timestamp with time zone
          ELSE NULL
        END
    `);

    // 3. Drop old columns
    await queryInterface.removeColumn('TimeLogs', 'timeInDate');
    await queryInterface.removeColumn('TimeLogs', 'timeInTime');
    await queryInterface.removeColumn('TimeLogs', 'timeOutDate');
    await queryInterface.removeColumn('TimeLogs', 'timeOutTime');
  },

  async down(queryInterface, Sequelize) {
    // Reverse logic if you need to rollback
    // 1. Re-add the old columns
    await queryInterface.addColumn('TimeLogs', 'timeInDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'timeInTime', {
      type: Sequelize.TIME,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'timeOutDate', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('TimeLogs', 'timeOutTime', {
      type: Sequelize.TIME,
      allowNull: true,
    });

    // 2. Migrate data back from timeInAt/timeOutAt
    //    Casting needed, e.g. storing date part in timeInDate & time part in timeInTime
    //    or keep it simple
    await queryInterface.sequelize.query(`
      UPDATE "TimeLogs"
      SET
        "timeInDate" = ("timeInAt")::date,
        "timeInTime" = ("timeInAt")::time
      WHERE "timeInAt" IS NOT NULL
    `);
    await queryInterface.sequelize.query(`
      UPDATE "TimeLogs"
      SET
        "timeOutDate" = ("timeOutAt")::date,
        "timeOutTime" = ("timeOutAt")::time
      WHERE "timeOutAt" IS NOT NULL
    `);

    // 3. Drop new columns
    await queryInterface.removeColumn('TimeLogs', 'timeInAt');
    await queryInterface.removeColumn('TimeLogs', 'timeOutAt');
  },
};
