// server/src/routes/adminRoutes.js

import express from 'express';
import { getCompanyUsers } from '../controllers/adminController.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { authorizeRoles } from '../middlewares/roleMiddleware.js'; // Correct import source

const router = express.Router();

// Protect all admin routes
router.use(authenticateToken);
router.use(authorizeRoles('admin', 'superAdmin')); // Adjust roles as needed

// GET /api/admin/users
router.get('/users', getCompanyUsers);

export default router;
