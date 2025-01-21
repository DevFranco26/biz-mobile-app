// File: server/server.js

const dotenv = require('dotenv');
const app = require('./app.js');
const sequelize = require('./config/database.js');
const router = require('./routes/index.js');
const errorHandler = require('./middlewares/errorHandler.js');;
const stripe = require('stripe')('sk_test_...');

dotenv.config();

const port = process.env.PORT || 5000;

app.use('/api', router);
app.use(errorHandler);

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection to the database has been established successfully.');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });
