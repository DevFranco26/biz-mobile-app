// File: server/config/config.js
const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
};
