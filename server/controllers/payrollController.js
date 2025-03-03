// File: server/controllers/payrollController.js
const { prisma } = require("../config/database");

// Retrieve payroll records for the authenticated user.
const getMyPayrollRecords = async (req, res) => {
  try {
    const records = await prisma.payrollRecords.findMany({
      where: { userId: req.user.id },
      orderBy: { startDate: "desc" },
    });
    return res.status(200).json({ message: "Payroll records retrieved.", data: records });
  } catch (error) {
    console.error("Error in getMyPayrollRecords:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Retrieve all payroll records for the authenticated user's company.
const getAllPayrollRecords = async (req, res) => {
  try {
    const records = await prisma.payrollRecords.findMany({
      where: { companyId: req.user.companyId },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { startDate: "desc" },
    });
    return res.status(200).json({ message: "All payroll records for company.", data: records });
  } catch (error) {
    console.error("Error in getAllPayrollRecords:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Create or update a user's pay rate.
const createOrUpdatePayRate = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { payType, rate } = req.body;
    if (!payType || !rate) return res.status(400).json({ message: "payType and rate are required." });
    if (!["hourly", "monthly"].includes(payType))
      return res.status(400).json({ message: "Invalid payType (hourly or monthly)." });
    const user = await prisma.users.findFirst({
      where: { id: userId, companyId: req.user.companyId },
    });
    if (!user) return res.status(404).json({ message: "User not found in your company." });
    let record = await prisma.payRates.findUnique({ where: { userId } });
    if (!record) {
      record = await prisma.payRates.create({
        data: { userId, payType, rate },
      });
    } else {
      record = await prisma.payRates.update({
        where: { userId },
        data: { payType, rate },
      });
    }
    return res.status(200).json({ message: "PayRate updated.", data: record });
  } catch (error) {
    console.error("Error in createOrUpdatePayRate:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update payroll settings for the company.
const updatePayrollSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { cutoffCycle, currency, overtimeRate } = req.body;
    if (cutoffCycle && !["daily", "weekly", "bi-weekly", "monthly"].includes(cutoffCycle))
      return res.status(400).json({ message: "Invalid cutoff cycle." });
    let settings = await prisma.payrollSettings.findUnique({
      where: { companyId },
    });
    if (!settings) {
      settings = await prisma.payrollSettings.create({
        data: {
          companyId,
          cutoffCycle: cutoffCycle || "bi-weekly",
          currency: currency || "USD",
          overtimeRate: overtimeRate || 1.5,
        },
      });
    } else {
      const updateData = {};
      if (cutoffCycle) updateData.cutoffCycle = cutoffCycle;
      if (currency) updateData.currency = currency;
      if (overtimeRate) updateData.overtimeRate = overtimeRate;
      settings = await prisma.payrollSettings.update({
        where: { companyId },
        data: updateData,
      });
    }
    return res.status(200).json({ message: "Payroll settings updated.", data: settings });
  } catch (error) {
    console.error("Error in updatePayrollSettings:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Retrieve payroll settings for the authenticated user's company.
const getPayrollSettings = async (req, res) => {
  try {
    const settings = await prisma.payrollSettings.findUnique({
      where: { companyId: req.user.companyId },
    });
    if (!settings) return res.status(404).json({ message: "No payroll settings found." });
    return res.status(200).json({ message: "Payroll settings retrieved.", data: settings });
  } catch (error) {
    console.error("Error in getPayrollSettings:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Calculate payroll for a user over a specified date range.
const calculatePayrollForUser = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    const companyId = req.user.companyId;
    const user = await prisma.users.findFirst({
      where: { id: Number(userId), companyId },
    });
    if (!user) return res.status(404).json({ message: "User not found in your company." });
    const payRateRow = await prisma.payRates.findUnique({
      where: { userId: Number(userId) },
    });
    if (!payRateRow) return res.status(400).json({ message: "No pay rate set for this user yet." });
    const { payType, rate } = payRateRow;
    const payrollSettings = await prisma.payrollSettings.findUnique({
      where: { companyId },
    });
    if (!payrollSettings) return res.status(400).json({ message: "No payroll settings found for this company." });
    const { overtimeRate } = payrollSettings;
    const timelogs = await prisma.timeLogs.findMany({
      where: {
        userId: Number(userId),
        timeInAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
    });
    let totalHours = 0;
    timelogs.forEach((log) => {
      const timeOut = log.timeOutAt ? new Date(log.timeOutAt) : new Date();
      const timeIn = new Date(log.timeInAt);
      let diff = timeOut - timeIn;
      if (log.lunchBreakStart && log.lunchBreakEnd) {
        diff -= new Date(log.lunchBreakEnd) - new Date(log.lunchBreakStart);
      }
      if (diff > 0) totalHours += diff / (1000 * 3600);
    });
    totalHours = Math.round(totalHours * 100) / 100;
    const normalHourThreshold = 40;
    let overtimeHours = totalHours > normalHourThreshold ? totalHours - normalHourThreshold : 0;
    let normalHours = totalHours > normalHourThreshold ? normalHourThreshold : totalHours;
    let grossPay = 0,
      overtimePay = 0;
    if (payType === "hourly") {
      const normalPay = normalHours * rate;
      overtimePay = overtimeHours * rate * overtimeRate;
      grossPay = normalPay + overtimePay;
    } else {
      grossPay = rate;
    }
    const netPay = grossPay;
    let record = await prisma.payrollRecords.findFirst({
      where: {
        userId: Number(userId),
        companyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      },
    });
    if (record) {
      record = await prisma.payrollRecords.update({
        where: { id: record.id },
        data: {
          payType,
          hoursWorked: totalHours,
          overtimeHours,
          overtimePay,
          grossPay,
          netPay,
        },
      });
    } else {
      record = await prisma.payrollRecords.create({
        data: {
          userId: Number(userId),
          companyId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          payType,
          hoursWorked: totalHours,
          overtimeHours,
          overtimePay,
          grossPay,
          netPay,
        },
      });
    }
    return res.status(200).json({ message: "Payroll calculation successful.", data: record });
  } catch (error) {
    console.error("Error in calculatePayrollForUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Retrieve payroll record for PDF generation.
const generatePayrollPDF = async (req, res) => {
  try {
    const recordId = Number(req.params.recordId);
    const record = await prisma.payrollRecords.findUnique({
      where: { id: recordId },
      include: {
        user: { select: { firstName: true, lastName: true, id: true } },
      },
    });
    if (!record) return res.status(404).json({ message: "Payroll record not found." });
    if (req.user.role !== "admin" && req.user.role !== "superadmin" && record.userId !== req.user.id)
      return res.status(403).json({ message: "Forbidden: This record is not yours." });
    return res.status(200).json({
      message: "Fetched payroll record for PDF generation (client side).",
      data: record,
    });
  } catch (error) {
    console.error("Error in generatePayrollPDF:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getMyPayrollRecords,
  getAllPayrollRecords,
  createOrUpdatePayRate,
  updatePayrollSettings,
  getPayrollSettings,
  calculatePayrollForUser,
  generatePayrollPDF,
};
