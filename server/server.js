// File: server/server.js

const dotenv = require('dotenv');
const app = require('./app.js');
const sequelize = require('./config/database.js');
const router = require('./routes/index.js');
const errorHandler = require('./middlewares/errorHandler.js');
const { User, Company, Location, TimeLogs, UserSettings, Leave, ShiftSchedule, UserShiftAssignment, PayrollRecords, PayRates, PayrollSettings } = require('./models/index.js');

dotenv.config();

const port = process.env.PORT || 5000;

// Use the centralized routes
app.use('/api', router);

// Error handling middleware
app.use(errorHandler);

// Test DB connection and start the server without syncing
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');

    // Start the server without syncing
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
