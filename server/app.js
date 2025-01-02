// File: server/app.js

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// Configure CORS to allow Authorization headers
app.use(cors({
  origin: 'http://localhost:19006', // Replace with your client's origin, e.g., Expo's default
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies to be sent if you opt to use them
}));

// Middleware
app.use(cookieParser()); // Use cookie-parser if handling cookies
app.use(express.json());

// Base route
app.get('/api', (req, res) => {
  res.send('API is running!');
});

module.exports = app;
