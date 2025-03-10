// File: app.js
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();

// Enable CORS with specified options
app.use(
  cors({
    origin: ["http://localhost:19006", "https://mybizbuddy.co", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Enable cookie parsing middleware
app.use(cookieParser());

// Conditional JSON parsing: skip JSON parsing for Stripe webhook endpoint.
// Use startsWith() to handle any query parameters.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith("/api/payments/stripe-webhook")) {
    // Skip JSON parsing so that req.body remains a raw Buffer
    next();
  } else {
    express.json()(req, res, next);
  }
});

// Test route to verify the API is running
app.get("/api", (req, res) => {
  res.send("API is running!");
});

module.exports = app;
