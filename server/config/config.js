// File: server/config/config.js

const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  development: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      // ssl: {
      //   require: true, // Set to true if your DB requires SSL
      //   rejectUnauthorized: false, // Set to true if you have a valid SSL certificate
      // },
    },
  },
  test: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false,
      // },
    },
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    dialectOptions: {
      // ssl: {
      //   require: true,
      //   rejectUnauthorized: false,
      // },
    },
  },
};
