const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: ["http://localhost:19006", "https://mybizbuddy.co"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cookieParser());

// Skip JSON parsing for the webhook endpoint
app.use((req, res, next) => {
  if (req.originalUrl === "/api/payment/stripe-webhook") {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.get("/api", (req, res) => {
  res.send("API is running!");
});

module.exports = app;
