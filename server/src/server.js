import app from './app.js'; 
import dotenv from 'dotenv';
import sequelize from './config/database.js'; 
import authRoutes from './routes/authRoutes.js';
import timeLogsRoutes from './routes/timeLogsRoutes.js';

dotenv.config();

const port = process.env.PORT || 5000;

// Use the routes in your app
app.use('/api/auth', authRoutes);
app.use('/api/timelogs', timeLogsRoutes);

// Test DB connection
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');

    // Sync models to create the tables in the DB
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { force: true };
    sequelize.sync(syncOptions)  // Corrected this part
      .then(() => {
        console.log('Models synced with the database');
        // Removed sample data creation
      })
      .catch((err) => {
        console.error('Error syncing models with the database:', err);
      });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
  