// src/controllers/userSettingsController.js

import UserSettings from '../models/UserSettings.js';
import Location from '../models/Location.js';
import User from '../models/Users.js';

// Assign a location restriction to a user
export const assignLocationToUser = async (req, res) => {
  const { userId, locationId, restrictionEnabled } = req.body;

  try {
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if the location exists
    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }

    // Create or update the user setting
    const [setting, created] = await UserSettings.findOrCreate({
      where: { userId, locationId },
      defaults: { restrictionEnabled },
    });

    if (!created) {
      // Update existing setting
      await setting.update({ restrictionEnabled });
    }

    res.status(200).json({ message: 'User setting updated successfully.', data: setting });
  } catch (error) {
    console.error('Error assigning location to user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Toggle location restriction for a user
export const toggleLocationRestriction = async (req, res) => {
  const { userId, locationId } = req.body;

  try {
    const setting = await UserSettings.findOne({
      where: { userId, locationId },
    });

    if (!setting) {
      return res.status(404).json({ message: 'User setting not found.' });
    }

    // Toggle the restriction
    await setting.update({ restrictionEnabled: !setting.restrictionEnabled });

    res.status(200).json({ message: 'Location restriction toggled successfully.', data: setting });
  } catch (error) {
    console.error('Error toggling location restriction:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all user settings
export const getUserSettings = async (req, res) => {
  const { userId } = req.query;

  try {
    const settings = await UserSettings.findAll({
      where: { userId },
      include: [{ model: Location, as: 'location' }],
    });

    res.status(200).json({ message: 'User settings retrieved successfully.', data: settings });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
