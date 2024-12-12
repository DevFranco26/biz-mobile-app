// File: src/controllers/userSettingsController.js

import UserSettings from '../models/UserSettings.js';
import Location from '../models/Location.js';
import User from '../models/Users.js';

// Assign or update location restriction for a user
export const assignLocationToUser = async (req, res) => {
  const { userId, locationId, restrictionEnabled } = req.body;

  try {
    // Check if the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // If restriction is enabled, locationId is required
    if (restrictionEnabled && !locationId) {
      return res.status(400).json({ message: 'Location ID is required when enabling restriction.' });
    }

    // If restriction is enabled, verify the location exists
    let location = null;
    if (restrictionEnabled && locationId) {
      location = await Location.findByPk(locationId);
      if (!location) {
        return res.status(404).json({ message: 'Location not found.' });
      }
    }

    // Find existing user settings for this user
    let setting = await UserSettings.findOne({ where: { userId } });

    if (setting) {
      // Update existing setting
      await setting.update({
        restrictionEnabled,
        locationId: restrictionEnabled ? locationId : null
      });
      return res.status(200).json({ message: 'User setting updated successfully.', data: setting });
    } else {
      if (!restrictionEnabled) {
        // If restriction is not enabled and no setting exists, no action needed
        return res.status(400).json({ message: 'Cannot disable restriction without an existing setting.' });
      }

      // Create a new user setting
      setting = await UserSettings.create({
        userId,
        restrictionEnabled,
        locationId
      });

      return res.status(201).json({ message: 'User setting created successfully.', data: setting });
    }
  } catch (error) {
    console.error('Error assigning location to user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Toggle location restriction for a user
export const toggleLocationRestriction = async (req, res) => {
  const { userId } = req.body;

  try {
    const setting = await UserSettings.findOne({ where: { userId } });
    if (!setting) {
      return res.status(404).json({ message: 'User setting not found. Cannot toggle restriction without an existing setting.' });
    }

    // Toggle the restrictionEnabled flag
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
