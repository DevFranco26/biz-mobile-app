// File: server.js

require("module-alias/register");
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app.js");
const { connect } = require("./src/config/database.js");
const router = require("@routes/index.js");
const errorHandler = require("@middlewares/errorHandler");

const PORT = process.env.PORT || 5000;

app.use("/api", router);

app.use(errorHandler);

connect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
