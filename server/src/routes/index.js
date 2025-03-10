// File: src/routes/index.js
/**
 * Main Routes Aggregator
 * ------------------------
 * This file aggregates all individual route modules and sets them up under the `/api` prefix.
 * Each sub-route module handles its own authentication and role-based access.
 */

const express = require("express");
const router = express.Router();

// Account & Company Management
const accountRoutes = require("@routes/Account/accountRoutes");
const companyRoutes = require("@routes/Account/companyRoutes");

// Department Management
const departmentsRoutes = require("@routes/Account/departmentRoutes");

// Payment & Subscription Management
const paymentsRoutes = require("@routes/Account/paymentRoutes");
const subscriptionPlansRoutes = require("@routes/Account/subscriptionPlanRoutes");
const subscriptionsRoutes = require("@routes/Account/subscriptionRoutes");

// Employee Management
const employeeRoutes = require("@routes/Features/employeeRoutes");

// Features
const leavesRoutes = require("@routes/Features/leaveRoutes");
const locationRoutes = require("@routes/Features/locationRoutes");
const payrollRoutes = require("@routes/Features/payrollRoutes");
const shiftSchedulesRoutes = require("@routes/Features/shiftScheduleRoutes");
const timeLogRoutes = require("@routes/Features/timeLogRoutes");
const employeeLocationRestrictionRoutes = require("@routes/Features/employeeLocationRestrictionRoutes");

// Setup route prefixes
router.use("/account", accountRoutes);
router.use("/company", companyRoutes);
router.use("/departments", departmentsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/subscription-plans", subscriptionPlansRoutes);
router.use("/subscriptions", subscriptionsRoutes);
router.use("/employee", employeeRoutes);
router.use("/leaves", leavesRoutes);
router.use("/location", locationRoutes);
router.use("/payroll", payrollRoutes);
router.use("/shiftschedules", shiftSchedulesRoutes);
router.use("/timelogs", timeLogRoutes);
router.use("/employee-location-restriction", employeeLocationRestrictionRoutes);

module.exports = router;
