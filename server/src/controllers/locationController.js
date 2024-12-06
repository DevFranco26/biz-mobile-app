// src/controllers/locationController.js

import Location from '../models/Location.js';
import UserSettings from '../models/UserSettings.js';
import User from '../models/Users.js';
import { Op } from 'sequelize';

// Create a new location
export const createLocation = async (req, res) => {
  const { adminId, label, latitude, longitude, radius } = req.body;

  try {
    const location = await Location.create({
      adminId,
      label,
      latitude,
      longitude,
      radius,
    });

    res.status(201).json({ message: 'Location created successfully.', data: location });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Get all locations for an admin
export const getLocations = async (req, res) => {
  const { adminId } = req.query;

  try {
    const locations = await Location.findAll({
      where: { adminId },
    });

    res.status(200).json({ message: 'Locations retrieved successfully.', data: locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a location
export const updateLocation = async (req, res) => {
  const { locationId } = req.params;
  const { label, latitude, longitude, radius } = req.body;

  try {
    const location = await Location.findByPk(locationId);

    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }

    await location.update({ label, latitude, longitude, radius });

    res.status(200).json({ message: 'Location updated successfully.', data: location });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a location
export const deleteLocation = async (req, res) => {
  const { locationId } = req.params;

  try {
    const location = await Location.findByPk(locationId);

    if (!location) {
      return res.status(404).json({ message: 'Location not found.' });
    }

    await location.destroy();

    res.status(200).json({ message: 'Location deleted successfully.' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
