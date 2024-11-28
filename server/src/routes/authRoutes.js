import express from 'express';
import { signIn, signOut } from '../controllers/authController.js';

const router = express.Router();

// POST route for sign-in
router.post('/sign-in', signIn);

// POST route for logout
router.post('/sign-out', signOut);

export default router;
