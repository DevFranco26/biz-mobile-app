// src/server.js

import dotenv from 'dotenv';
import app from './app.js'; 
import sequelize from './config/database.js'; 
import router from './routes/index.js'; // Import centralized router
import './models/index.js'; // Import models and define associations
import errorHandler from './middlewares/errorHandler.js';

dotenv.config();

const port = process.env.PORT || 5000;

// Use the centralized routes
app.use('/api', router);

app.use(errorHandler);

// Test DB connection and start the server
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');

    // Sync models to create the tables in the DB
    const syncOptions = process.env.NODE_ENV === 'production' ? {} : { force: false };
    sequelize.sync(syncOptions)
      .then(() => {
        console.log('Models synced with the database');
        // Start the server only after successful sync
        app.listen(port, () => {
          console.log(`Server is running on port ${port}`);
        });
      })
      .catch((err) => {
        console.error('Error syncing models with the database:', err);
      });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
