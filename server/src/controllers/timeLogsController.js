// src/controllers/timeLogsController.js

import TimeLogs from '../models/TimeLogs.js';
import User from '../models/Users.js';
import UserSettings from '../models/UserSettings.js';
import Location from '../models/Location.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';

// Helper function to calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distance = R * c;
  
  return distance; // in meters
};

// Time-In Handler with Location Validation
export const timeIn = async (req, res) => {
  console.log('Time-In request body:', req.body);
  const { userId, deviceInfo, location, date, time, timeZone } = req.body;

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

    let isWithinAllowedLocation = true; // Default to true if no restrictions

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
      return res.status(400).json({ message: 'Punch location is outside the allowed areas.' });
    }

    // Create a new time-in log
    const newLog = await TimeLogs.create(
      {
        userId,
        timeInDate: date,
        timeInTime: time,
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
    res.status(201).json({ message: 'Time-in recorded successfully.', data: newLog });
  } catch (error) {
    console.error('Error during time-in:', error);

    // Check if the error is a Sequelize error
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ message: 'Database error during time-in operation.' });
    }

    // Generic error response
    res.status(500).json({ message: 'Internal server error during time-in.' });
  }
};

// Time-Out Handler with Location Validation
export const timeOut = async (req, res) => {
  console.log('Time-Out request body:', req.body);
  const { userId, deviceInfo, location, date, time, timeZone } = req.body;

  try {
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

    // Fetch user's active location restrictions
    const userSettings = await UserSettings.findAll({
      where: { userId, restrictionEnabled: true },
      include: [{ model: Location, as: 'location' }],
      transaction,
    });

    let isWithinAllowedLocation = true; // Default to true if no restrictions

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
      return res.status(400).json({ message: 'Punch location is outside the allowed areas.' });
    }

    // Update the time-out details and mark the log as inactive
    await activeLog.update(
      {
        timeOutDate: date,
        timeOutTime: time,
        timeOutTimeZone: timeZone,
        status: false,
        timeOutDevice: deviceInfo,
        timeOutLat: location.latitude,
        timeOutLong: location.longitude,
      },
      { transaction }
    );

    // Update user's current status
    await User.update({ status: false }, { where: { id: userId }, transaction });

    await transaction.commit();
    res.status(200).json({ message: 'Time-out recorded successfully.', data: activeLog });
  } catch (error) {
    console.error('Error during time-out:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get Monthly Logs
export const getMonthlyLogs = async (req, res) => {
  const { userId, year, month } = req.query;

  try {
    const firstDate = new Date(Date.UTC(year, month - 1, 1));
    const lastDate = new Date(Date.UTC(year, month, 0));

    const logs = await TimeLogs.findAll({
      where: {
        userId,
        timeInDate: { [Op.gte]: firstDate, [Op.lte]: lastDate },
      },
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({ message: 'Logs retrieved successfully.', data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export const getRangeLogs = async (req, res) => {
  const { userId, startDate, endDate } = req.query;

  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ message: 'Missing required parameters.' });
  }

  try {
    const logs = await TimeLogs.findAll({
      where: {
        userId,
        timeInDate: {
          [Op.between]: [startDate, endDate],
        },
      },
      order: [['createdAt', 'ASC']],
    });

    res.status(200).json({ message: 'Logs retrieved successfully.', data: logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get User's Latest Time Log
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
