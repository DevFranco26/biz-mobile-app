// File: server/routes/authRoutes.js

const express = require('express');
const { signIn, signOut, getCurrentUser, updateCurrentUser } = require('../controllers/authController.js');
const authenticate = require('../middlewares/authMiddleware.js');

const router = express.Router();

// POST route for sign-in
router.post('/sign-in', signIn);

// POST route for logout
router.post('/sign-out', signOut);

// All routes below require authentication
router.use(authenticate);

// Get current user info
router.get('/user', getCurrentUser);

// Update current user info
router.put('/user', updateCurrentUser);

module.exports = router;
