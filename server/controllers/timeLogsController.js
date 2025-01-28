// File: server/controllers/timeLogsController.js

const TimeLogs = require('../models/TimeLogs.js');
const User = require('../models/Users.js');
const UserSettings = require('../models/UserSettings.js');
const Location = require('../models/Location.js');
const sequelize = require('../config/database.js');
const { Op } = require('sequelize');

/**
 * Helper Function: Calculate Distance Between Two Coordinates
 * Uses the Haversine formula to calculate distance in meters.
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} - Distance in meters
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;
  return distance; // in meters
};

/**
 * Time-In Handler with Location Validation
 * Uses a single timeInAt (timestamp), stored as new Date().
 */
const timeIn = async (req, res) => {
  console.log('Time-In request body:', req.body);
  const { userId, deviceInfo, location, timeZone } = req.body;
  const timeInAt = new Date();

  try {
    const transaction = await sequelize.transaction();

    // Check if the user is already time-in
    const activeLog = await TimeLogs.findOne({
      where: { userId, status: true },
      transaction,
    });

    if (activeLog) {
      await transaction.rollback();
      return res.status(400).json({ message: 'User is already time-in.' });
    }

    // Fetch user's active location restrictions
    const userSettings = await UserSettings.findAll({
      where: { userId, restrictionEnabled: true },
      include: [{ model: Location, as: 'location' }],
      transaction,
    });

    let isWithinAllowedLocation = true; // Default = true if no restrictions

    if (userSettings.length > 0) {
      isWithinAllowedLocation = userSettings.some((setting) => {
        const loc = setting.location;
        const distance = calculateDistance(
          parseFloat(location.latitude),
          parseFloat(location.longitude),
          parseFloat(loc.latitude),
          parseFloat(loc.longitude)
        );
        return distance <= loc.radius;
      });
    }

    if (!isWithinAllowedLocation) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: 'Punch location is outside the allowed areas.' });
    }

    // Create a new time-in log with timeInAt
    const newLog = await TimeLogs.create(
      {
        userId,
        timeInAt, // single timestamp
        timeInTimeZone: timeZone,
        status: true,
        timeInDevice: deviceInfo,
        timeInLat: location.latitude,
        timeInLong: location.longitude,
      },
      { transaction }
    );

    // Update user's current status
    await User.update({ status: true }, { where: { id: userId }, transaction });

    await transaction.commit();
    return res
      .status(201)
      .json({ message: 'Time-in recorded successfully.', data: newLog });
  } catch (error) {
    console.error('Error in timeIn:', error);

    if (error.name === 'SequelizeDatabaseError') {
      console.log(error.message);
      return res
        .status(500)
        .json({ message: 'Database error during time-in operation.' });
    }

    res.status(500).json({ message: 'Internal server error during time-in.' });
  }
};

/**
 * Time-Out Handler with Location Validation and totalHours Calculation
 */
const timeOut = async (req, res) => {
  console.log('Time-Out request body:', req.body);
  const { userId, deviceInfo, location, timeZone } = req.body;
  const timeOutAt = new Date();

  try {
    const transaction = await sequelize.transaction();

    // Get the latest active time-in record
    const activeLog = await TimeLogs.findOne({
      where: { userId, status: true },
      order: [['createdAt', 'DESC']],
      transaction,
    });

    if (!activeLog) {
      await transaction.rollback();
      return res.status(400).json({ message: 'No active time-in found.' });
    }

    // Validate location restrictions if any
    const userSettings = await UserSettings.findAll({
      where: { userId, restrictionEnabled: true },
      include: [{ model: Location, as: 'location' }],
      transaction,
    });

    let isWithinAllowedLocation = true;
    if (userSettings.length > 0) {
      isWithinAllowedLocation = userSettings.some((setting) => {
        const loc = setting.location;
        const distance = calculateDistance(
          parseFloat(location.latitude),
          parseFloat(location.longitude),
          parseFloat(loc.latitude),
          parseFloat(loc.longitude)
        );
        return distance <= loc.radius;
      });
    }

    if (!isWithinAllowedLocation) {
      await transaction.rollback();
      return res
        .status(400)
        .json({ message: 'Punch location is outside the allowed areas.' });
    }

    // Update the time-out details
    await activeLog.update(
      {
        timeOutAt, // single timestamp
        timeOutTimeZone: timeZone,
        status: false,
        timeOutDevice: deviceInfo,
        timeOutLat: location.latitude,
        timeOutLong: location.longitude,
      },
      { transaction }
    );

    // Calculate totalHours
    let totalHours = 0;

    if (activeLog.lunchBreakStart && activeLog.lunchBreakEnd) {
      const totalTime = timeOutAt - activeLog.timeInAt; // in milliseconds
      const breakTime = activeLog.lunchBreakEnd - activeLog.lunchBreakStart; // in milliseconds

      // Ensure that breakTime is not negative
      if (breakTime < 0) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Invalid lunch break times.' });
      }

      totalHours = (totalTime - breakTime) / (1000 * 60 * 60); // Convert to hours
    } else {
      // If no lunch break taken, calculate total hours normally
      totalHours = (timeOutAt - activeLog.timeInAt) / (1000 * 60 * 60); // Convert to hours
    }

    // Round to two decimal places
    totalHours = Math.round(totalHours * 100) / 100;

    // Update the totalHours in the activeLog
    await activeLog.update(
      {
        totalHours,
      },
      { transaction }
    );

    // Update user's current status
    await User.update({ status: false }, { where: { id: userId }, transaction });

    await transaction.commit();
    return res
      .status(200)
      .json({ message: 'Time-out recorded successfully.', data: activeLog });
  } catch (error) {
    console.error('Error in timeOut:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Monthly Logs
 * Filters by timeInAt within the specified month.
 */
const getMonthlyLogs = async (req, res) => {
  const { userId, year, month } = req.query;

  try {
    const firstDate = new Date(Date.UTC(year, month - 1, 1));
    const lastDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

    // Logs where timeInAt is within the specified month
    const logs = await TimeLogs.findAll({
      where: {
        userId,
        timeInAt: {
          [Op.gte]: firstDate,
          [Op.lte]: lastDate,
        },
      },
      order: [['createdAt', 'ASC']],
    });

    return res
      .status(200)
      .json({ message: 'Logs retrieved successfully.', data: logs });
  } catch (error) {
    console.error('Error in getMonthlyLogs:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Range Logs with Enhanced Security
 * Filters by timeInAt between startDate and endDate.
 */
const getRangeLogs = async (req, res) => {
  let { userId, startDate, endDate } = req.query;

  try {
    const requestingUser = await User.findOne({ where: { id: req.user.id } });
    if (!requestingUser) {
      return res.status(404).json({ message: 'Requesting user not found.' });
    }

    if (requestingUser.role !== 'admin' && requestingUser.role !== 'superAdmin') {
      // Regular users => only see their own logs
      userId = req.user.id;
    } else {
      // Admins => can specify userId, or default to themselves
      if (!userId) {
        userId = req.user.id;
      } else {
        // Verify target user
        const targetUser = await User.findOne({ where: { id: userId } });
        if (!targetUser) {
          return res.status(404).json({ message: 'Target user not found.' });
        }
        if (targetUser.companyId !== requestingUser.companyId) {
          return res
            .status(403)
            .json({
              message: 'Access denied: User belongs to a different company.',
            });
        }
      }
    }

    // Validate
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: 'startDate and endDate are required.' });
    }

    // Filter by timeInAt
    const logs = await TimeLogs.findAll({
      where: {
        userId,
        timeInAt: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'ASC']],
    });

    return res
      .status(200)
      .json({ message: 'Logs retrieved successfully.', data: logs });
  } catch (error) {
    console.error('Error in getRangeLogs:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get User's Latest Time Log
 * Returns the most recent timeInAt record
 */
const getUserTimeLog = async (req, res) => {
  const { userId } = req.params;

  try {
    const timeLog = await TimeLogs.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    if (!timeLog) {
      return res
        .status(404)
        .json({ message: 'No time log found for this user.' });
    }

    return res
      .status(200)
      .json({ message: 'Time log fetched successfully.', data: timeLog });
  } catch (error) {
    console.error('Error in getUserTimeLog:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Coffee Break Toggle with 2 breaks max
 * Ensures consistent field naming with the TimeLogs model
 */
const coffeeBreakToggle = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find active time-in record
    const activeLog = await TimeLogs.findOne({
      where: { userId, status: true },
      order: [['createdAt', 'DESC']],
    });

    if (!activeLog) {
      return res
        .status(400)
        .json({ message: 'No active time-in found. Cannot toggle coffee break.' });
    }

    // If the user is on lunch break now, end it automatically
    if (activeLog.lunchBreakStart && !activeLog.lunchBreakEnd) {
      await activeLog.update({ lunchBreakEnd: new Date() });
    }

    // Step-by-step check for coffee breaks
    if (!activeLog.coffeeBreakStart) {
      // Start coffee break #1
      await activeLog.update({ coffeeBreakStart: new Date() });
      return res
        .status(200)
        .json({ message: 'Coffee break #1 started.', data: activeLog });
    }

    if (activeLog.coffeeBreakStart && !activeLog.coffeeBreakEnd) {
      // End coffee break #1
      await activeLog.update({ coffeeBreakEnd: new Date() });
      return res
        .status(200)
        .json({ message: 'Coffee break #1 ended.', data: activeLog });
    }

    // Check coffeeBreak2
    if (!activeLog.coffeeBreak2Start) {
      // Start coffee break #2
      await activeLog.update({ coffeeBreak2Start: new Date() });
      return res
        .status(200)
        .json({ message: 'Coffee break #2 started.', data: activeLog });
    }

    if (activeLog.coffeeBreak2Start && !activeLog.coffeeBreak2End) {
      // End coffee break #2
      await activeLog.update({ coffeeBreak2End: new Date() });
      return res
        .status(200)
        .json({ message: 'Coffee break #2 ended.', data: activeLog });
    }

    // If we get here => 2 coffee breaks used fully
    return res
      .status(400)
      .json({ message: 'Max coffee breaks used for this shift.' });
  } catch (error) {
    console.error('Error in coffeeBreakToggle:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error toggling coffee break.' });
  }
};

/**
 * Lunch Break Toggle with single usage
 * Ensures consistent field naming with the TimeLogs model
 */
const lunchBreakToggle = async (req, res) => {
  try {
    const { userId } = req.body;

    // Find active time-in record
    const activeLog = await TimeLogs.findOne({
      where: { userId, status: true },
      order: [['createdAt', 'DESC']],
    });
    if (!activeLog) {
      return res
        .status(400)
        .json({ message: 'No active time-in found. Cannot toggle lunch break.' });
    }

    // If coffee break is ongoing => end it
    if (activeLog.coffeeBreakStart && !activeLog.coffeeBreakEnd) {
      await activeLog.update({ coffeeBreakEnd: new Date() });
    } else if (activeLog.coffeeBreak2Start && !activeLog.coffeeBreak2End) {
      await activeLog.update({ coffeeBreak2End: new Date() });
    }

    // Check lunch break usage
    if (!activeLog.lunchBreakStart) {
      // Start lunch break
      await activeLog.update({ lunchBreakStart: new Date() });
      return res
        .status(200)
        .json({ message: 'Lunch break started.', data: activeLog });
    }

    if (activeLog.lunchBreakStart && !activeLog.lunchBreakEnd) {
      // End lunch break
      await activeLog.update({ lunchBreakEnd: new Date() });
      return res
        .status(200)
        .json({ message: 'Lunch break ended.', data: activeLog });
    }

    // If lunchBreakStart & lunchBreakEnd => lunch used up
    return res
      .status(400)
      .json({ message: 'Lunch break already used for this shift.' });
  } catch (error) {
    console.error('Error in lunchBreakToggle:', error);
    return res
      .status(500)
      .json({ message: 'Internal server error toggling lunch break.' });
  }
};

module.exports = {
  timeIn,
  timeOut,
  getMonthlyLogs,
  getRangeLogs,
  getUserTimeLog,
  coffeeBreakToggle,
  lunchBreakToggle,
};
