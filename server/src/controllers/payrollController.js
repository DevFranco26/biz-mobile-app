// src/controllers/payrollController.js

import { 
  User, 
  PayrollRecords, 
  PayRates, 
  PayrollSettings, 
  Company, 
  TimeLogs 
} from '../models/index.js';
import { Op } from 'sequelize';

/**
 * GET /api/payroll/my
 * For a user to get their own payroll records
 */
export const getMyPayrollRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await PayrollRecords.findAll({
      where: { userId },
      order: [['startDate', 'DESC']],
    });
    return res.status(200).json({ message: 'Payroll records retrieved.', data: records });
  } catch (error) {
    console.error('Error getMyPayrollRecords:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * GET /api/payroll
 * Admin/superAdmin: retrieve all records for the requesting user’s company
 */
export const getAllPayrollRecords = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const records = await PayrollRecords.findAll({
      where: { companyId },
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName'] }],
      order: [['startDate', 'DESC']],
    });
    return res.status(200).json({ message: 'All payroll records for company.', data: records });
  } catch (error) {
    console.error('Error getAllPayrollRecords:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/payroll/payrate/:userId
 * Admin sets a user’s pay rate
 */
export const createOrUpdatePayRate = async (req, res) => {
  try {
    const { userId } = req.params;
    const { payType, rate } = req.body;

    if (!payType || !rate) {
      return res.status(400).json({ message: 'payType and rate are required.' });
    }
    if (!['hourly', 'monthly'].includes(payType)) {
      return res.status(400).json({ message: 'Invalid payType (hourly or monthly).' });
    }

    // Check user in same company
    const user = await User.findOne({ where: { id: userId, companyId: req.user.companyId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found in your company.' });
    }

    let record = await PayRates.findOne({ where: { userId } });
    if (!record) {
      record = await PayRates.create({ userId, payType, rate });
    } else {
      await record.update({ payType, rate });
    }
    return res.status(200).json({ message: 'PayRate updated.', data: record });
  } catch (error) {
    console.error('Error createOrUpdatePayRate:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * PUT /api/payroll/settings
 * GET /api/payroll/settings
 * Admin sets or retrieves payroll settings (cutoffCycle, currency, overtimeRate)
 */
export const updatePayrollSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { cutoffCycle, currency, overtimeRate } = req.body;

    // Validate cutoffCycle
    if (cutoffCycle && !['daily','weekly','bi-weekly','monthly'].includes(cutoffCycle)) {
      return res.status(400).json({ message: 'Invalid cutoff cycle.' });
    }

    let settings = await PayrollSettings.findOne({ where: { companyId } });
    if (!settings) {
      settings = await PayrollSettings.create({
        companyId,
        cutoffCycle: cutoffCycle || 'bi-weekly',
        currency: currency || 'USD',
        overtimeRate: overtimeRate || 1.5,
      });
    } else {
      const updateData = {};
      if (cutoffCycle) updateData.cutoffCycle = cutoffCycle;
      if (currency) updateData.currency = currency;
      if (overtimeRate) updateData.overtimeRate = overtimeRate;
      await settings.update(updateData);
    }

    return res.status(200).json({ message: 'Payroll settings updated.', data: settings });
  } catch (error) {
    console.error('Error updating payroll settings:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getPayrollSettings = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const settings = await PayrollSettings.findOne({ where: { companyId } });
    if (!settings) {
      return res.status(404).json({ message: 'No payroll settings found.' });
    }
    return res.status(200).json({ message: 'Payroll settings retrieved.', data: settings });
  } catch (error) {
    console.error('Error getPayrollSettings:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/payroll/calculate
 * Admin or superAdmin: manually trigger a user’s payroll calculation for a date range
 */
export const calculatePayrollForUser = async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.body;
    const requestingCompanyId = req.user.companyId;
    const requestingUserRole = req.user.role;

    // 1) Make sure user is in same company
    const user = await User.findOne({ where: { id: userId, companyId: requestingCompanyId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found in your company.' });
    }

    // 2) Get pay rate
    const payRateRow = await PayRates.findOne({ where: { userId } });
    if (!payRateRow) {
      return res.status(400).json({ message: 'No pay rate set for this user yet.' });
    }
    const { payType, rate } = payRateRow;

    // 3) Fetch payroll settings for overtimeRate, currency
    const payrollSettings = await PayrollSettings.findOne({ where: { companyId: requestingCompanyId } });
    if (!payrollSettings) {
      return res.status(400).json({ message: 'No payroll settings found for this company.' });
    }
    const { overtimeRate, currency } = payrollSettings;

    // 4) Retrieve timelogs in the date range
    const timelogs = await TimeLogs.findAll({
      where: {
        userId,
        // we assume timeInDate/timeOutDate are set
        timeInDate: { [Op.gte]: startDate },
        timeOutDate: { [Op.lte]: endDate },
      },
    });

    // 5) Sum total hours
    let totalHours = 0.0;
    timelogs.forEach((log) => {
      if (log.timeInDate && log.timeOutDate && log.timeInTime && log.timeOutTime) {
        const inDT = new Date(`${log.timeInDate}T${log.timeInTime}`);
        const outDT = new Date(`${log.timeOutDate}T${log.timeOutTime}`);
        const diff = outDT - inDT; 
        if (diff > 0) {
          totalHours += diff / 1000 / 3600;
        }
      }
    });

    // 6) Calculate normal vs overtime hours
    // (Example: if > 40 hours in total range, remainder is overtime)
    const normalHourThreshold = 40; 
    let overtimeHours = 0.0;
    let normalHours = totalHours;
    if (totalHours > normalHourThreshold) {
      overtimeHours = totalHours - normalHourThreshold;
      normalHours = normalHourThreshold;
    }

    // 7) Calculate pay
    let grossPay = 0;
    let overtimePay = 0;
    if (payType === 'hourly') {
      const normalPay = normalHours * rate;
      overtimePay = overtimeHours * rate * overtimeRate; 
      grossPay = normalPay + overtimePay;
    } else {
      // monthly pay = rate ( ignoring partial months for simplicity )
      // ignoring overtime for monthly, or you can still add it if you want
      grossPay = rate;
    }

    const netPay = grossPay; // no advanced deductions
    // 8) Upsert to PayrollRecords
    const [record, created] = await PayrollRecords.findOrCreate({
      where: {
        userId,
        companyId: requestingCompanyId,
        startDate,
        endDate,
      },
      defaults: {
        payType,
        hoursWorked: totalHours,
        overtimeHours,
        overtimePay,
        grossPay,
        netPay,
      },
    });
    if (!created) {
      await record.update({
        payType,
        hoursWorked: totalHours,
        overtimeHours,
        overtimePay,
        grossPay,
        netPay,
      });
    }

    return res.status(200).json({
      message: 'Payroll calculation success.',
      data: record,
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * GET /api/payroll/:recordId/pdf
 * For front-end to fetch record data (the front end does PDF generation).
 */
export const generatePayrollPDF = async (req, res) => {
  try {
    const { recordId } = req.params;
    const record = await PayrollRecords.findByPk(recordId, {
      include: [{ model: User, as: 'user', attributes: ['firstName', 'lastName', 'id'] }],
    });
    if (!record) {
      return res.status(404).json({ message: 'Payroll record not found.' });
    }
    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
      if (record.userId !== req.user.id) {
        return res.status(403).json({ message: 'Forbidden. This record is not yours.' });
      }
    }
    // Return the record. The front end will do PDF generation
    return res.status(200).json({
      message: 'Fetched payroll record for PDF generation (client side).',
      data: record,
    });
  } catch (error) {
    console.error('Error generatePayrollPDF:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
