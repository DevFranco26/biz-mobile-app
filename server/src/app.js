import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Base route
app.get('/api', (req, res) => {
  res.send('API is running!');
});

export default app;
