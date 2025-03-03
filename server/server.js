// File: server/server.js
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app.js");
const { connect } = require("./config/database.js");
const router = require("./routes/index.js");
const errorHandler = require("./middlewares/errorHandler.js");
const stripe = require("stripe")("sk_test_...");

const port = process.env.PORT || 5000;

app.use("/api", router);
app.use(errorHandler);

connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
