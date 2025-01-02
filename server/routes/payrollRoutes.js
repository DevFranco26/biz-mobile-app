// File: server/routes/payrollRoutes.js

const express = require('express');
const {
  getMyPayrollRecords,
  getAllPayrollRecords,
  createOrUpdatePayRate,
  calculatePayrollForUser,
  generatePayrollPDF,
  updatePayrollSettings,
  getPayrollSettings
} = require('../controllers/payrollController.js');

const authenticate = require('../middlewares/authMiddleware.js');
const { authorizeRoles } = require('../middlewares/roleMiddleware.js');

const router = express.Router();

// Protected routes
router.use(authenticate);

// For a user to get their own payroll
router.get('/my', authorizeRoles('user', 'admin', 'superAdmin', 'supervisor'), getMyPayrollRecords);

// For admin to get payroll for entire company
router.get('/', authorizeRoles('admin', 'superAdmin'), getAllPayrollRecords);

// For admin to set a user’s pay rate
router.post('/payrate/:userId', authorizeRoles('admin', 'superAdmin'), createOrUpdatePayRate);

// For admin to update & get payroll settings
router.put('/settings', authorizeRoles('admin', 'superAdmin'), updatePayrollSettings);
router.get('/settings', authorizeRoles('admin', 'superAdmin'), getPayrollSettings);

// (Optional) Recalc
router.post('/calculate', authorizeRoles('admin', 'superAdmin'), calculatePayrollForUser);

// (No server-side PDF generation; just fetch record)
router.get('/:recordId/pdf', authorizeRoles('user', 'admin', 'superAdmin'), generatePayrollPDF);

module.exports = router;
