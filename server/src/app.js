// src/app.js

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // Ensure cookie-parser is imported

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

export default app;
