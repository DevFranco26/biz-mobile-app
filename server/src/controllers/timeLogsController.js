import TimeLogs from '../models/TimeLogs.js';
import User from '../models/Users.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Time-In Handler
export const timeIn = async (req, res) => {
  const { userId, deviceInfo } = req.body;

  try {
    console.log("Time-In request received for user:", userId);
    console.log("Device Info:", deviceInfo);

    const transaction = await sequelize.transaction();

    // Check if the user is already time-in
    const activeLog = await TimeLogs.findOne(
      { where: { userId, status: true }, transaction }
    );

    if (activeLog) {
      await transaction.rollback();
      return res.status(400).json({ message: 'User is already time-in.' });
    }

    const now = new Date();
    const newLog = await TimeLogs.create(
      {
        userId,
        timeInDate: now.toISOString().split('T')[0],
        timeInTime: now.toTimeString().split(' ')[0],
        status: true,
        timeInDevice: deviceInfo, // Store the deviceInfo as JSON directly
      },
      { transaction }
    );

    // Update user's current status
    await User.update({ current_status: true }, { where: { id: userId }, transaction });

    await transaction.commit();
    res.status(201).json({ message: 'Time-in recorded successfully.', data: newLog });
  } catch (error) {
    console.error('Error during time-in:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Time-Out Handler
export const timeOut = async (req, res) => {
  const { userId, deviceInfo } = req.body;

  try {
    console.log("Time-Out request received for user:", userId);
    console.log("Device Info:", deviceInfo);

    const transaction = await sequelize.transaction();

    // Get the latest active time-in record
    const activeLog = await TimeLogs.findOne(
      {
        where: { userId, status: true },
        order: [['createdAt', 'DESC']],
        transaction,
      }
    );

    if (!activeLog) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No active time-in found.' });
    }

    const now = new Date();

    // Update the time-out details and mark the log as inactive
    await activeLog.update(
      {
        timeOutDate: now.toISOString().split('T')[0],
        timeOutTime: now.toTimeString().split(' ')[0],
        status: false,
        timeOutDevice: deviceInfo, // Store the deviceInfo as JSON directly when time-out
      },
      { transaction }
    );

    // Update user's current status
    await User.update({ current_status: false }, { where: { id: userId }, transaction });

    await transaction.commit();
    res.status(200).json({ message: 'Time-out recorded successfully.', data: activeLog });
  } catch (error) {
    console.error('Error during time-out:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};



export const getMonthlyLogs = async (req, res) => {
  const { userId, year, month } = req.query;

  // Validate year and month
  if (!userId || !year || !month) {
    return res.status(400).json({ message: 'User ID, year, and month are required.' });
  }

  // Ensure valid year and month format
  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Invalid year or month format.' });
  }

  try {
    console.log("Fetching monthly logs for user:", userId);

    // Calculate the first and last date of the given month
    const firstDate = `${year}-${month.padStart(2, '0')}-01`;
    const lastDate = new Date(year, month, 0).toISOString().split('T')[0];  // Dynamically get last day of month

    console.log('First Date:', firstDate);
    console.log('Last Date:', lastDate);

    // Fetch logs for the given month
    const logs = await TimeLogs.findAll({
      where: {
        userId,
        timeInDate: {
          [Op.between]: [firstDate, lastDate],
        },
      },
    });

    console.log('Logs:', logs);

    res.status(200).json({ message: 'Logs retrieved successfully.', data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getUserTimeLog = async (req, res) => {
  const { userId } = req.params;

  try {
    const timeLog = await TimeLogs.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (!timeLog) {
      return res.status(404).json({ message: 'No time log found for this user.' });
    }

    res.status(200).json({ message: 'Time log fetched successfully.', data: timeLog });
  } catch (error) {
    console.error('Error fetching time log:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
