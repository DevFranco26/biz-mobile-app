// server/src/controllers/locationController.js

import Location from '../models/Location.js';
import UserSettings from '../models/UserSettings.js';
import User from '../models/Users.js';
import { Op } from 'sequelize';

// Create a new location
export const createLocation = async (req, res) => {
  // Extract adminId from the authenticated user
  const adminId = req.user?.id;

  // Extract other fields from the request body
  const { label, latitude, longitude, radius } = req.body;

  // Validate adminId
  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized: Admin ID not found.' });
  }

  // Validate required fields
  if (!label || !latitude || !longitude || !radius) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const location = await Location.create({
      adminId,      // Use the extracted adminId
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

export const getLocations = async (req, res) => {
  try {
    // Extract adminId from the authenticated user
    const adminId = req.user?.id;

    console.log('Admin ID:', adminId);

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required.' });
    }

    // Fetch locations from the database
    const locations = await Location.findAll({
      where: { adminId },
    });

    console.log('Locations Retrieved:', locations);
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

    // Ensure that the location belongs to the authenticated admin
    if (location.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to update this location.' });
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

    // Ensure that the location belongs to the authenticated admin
    if (location.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to delete this location.' });
    }

    await location.destroy();

    res.status(200).json({ message: 'Location deleted successfully.' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
