// File: server/routes/index.js
const express = require("express");
const authRoutes = require("./authRoutes.js");
const timeLogsRoutes = require("./timeLogsRoutes.js");
const locationRoutes = require("./locationRoutes.js");
const userSettingsRoutes = require("./userSettingsRoutes.js");
const usersRoutes = require("./usersRoutes.js");
const companiesRoutes = require("./companiesRoutes.js");
const leavesRoutes = require("./leavesRoutes.js");
const shiftSchedulesRoutes = require("./shiftSchedulesRoutes.js");
const payrollRoutes = require("./payrollRoutes.js");
const departmentsRoutes = require("./departmentsRoutes.js");
const subscriptionPlansRoutes = require("./subscriptionPlansRoutes.js");
const subscriptionsRoutes = require("./subscriptionsRoutes.js");
const paymentsRoutes = require("./paymentsRoutes.js");
const authenticate = require("../middlewares/authMiddleware.js");
const updateActivityMiddleware = require("../middlewares/updateActivityMiddleware.js");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/subscription-plans", subscriptionPlansRoutes);
router.use("/payment", paymentsRoutes);
router.use("/subscriptions", subscriptionsRoutes);

router.use(authenticate, updateActivityMiddleware);

router.use("/timelogs", timeLogsRoutes);
router.use("/locations", locationRoutes);
router.use("/usersettings", userSettingsRoutes);
router.use("/users", usersRoutes);
router.use("/companies", companiesRoutes);
router.use("/leaves", leavesRoutes);
router.use("/shiftschedules", shiftSchedulesRoutes);
router.use("/payroll", payrollRoutes);
router.use("/departments", departmentsRoutes);
router.use("/payments", paymentsRoutes);

module.exports = router;
