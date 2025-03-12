// src/controllers/Features/locationController.js

const { prisma } = require("@config/connection");

const createLocation = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { label, latitude, longitude, radius } = req.body;
    if (!adminId) {
      return res.status(401).json({ message: "Unauthorized: Admin ID not found." });
    }
    if (!label || !latitude || !longitude || !radius) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newLocation = await prisma.locations.create({
      data: { adminid: adminId, label, latitude, longitude, radius },
    });
    const fullLocation = await prisma.locations.findUnique({
      where: { id: newLocation.id },
      include: { admin: { select: { id: true, email: true, companyId: true } } },
    });
    return res.status(201).json({ message: "Location created successfully.", data: fullLocation });
  } catch (error) {
    console.error("Error in createLocation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/locations
 * Description: Retrieves all locations for the authenticated user's company.
 */
const getLocations = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: "Company ID is required." });
    }
    const locations = await prisma.locations.findMany({
      where: { admin: { companyId } },
      include: {
        admin: { select: { id: true, email: true, companyId: true } },
        lastEditor: { select: { id: true, email: true, companyId: true } },
      },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ message: "Locations retrieved successfully.", data: locations });
  } catch (error) {
    console.error("Error in getLocations:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/features/locations/:locationId
 * Description: Updates an existing location.
 */
const updateLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const { label, latitude, longitude, radius } = req.body;
    const location = await prisma.locations.findUnique({ where: { id: Number(locationId) } });
    if (!location) {
      return res.status(404).json({ message: "Location not found." });
    }
    const adminUser = await prisma.users.findUnique({ where: { id: location.adminid } });
    if (!adminUser || adminUser.companyId !== req.user.companyId) {
      return res.status(403).json({ message: "Forbidden: Different company." });
    }
    const updatedLocation = await prisma.locations.update({
      where: { id: Number(locationId) },
      data: { label, latitude, longitude, radius, updatedBy: req.user.id },
    });
    const fullLocation = await prisma.locations.findUnique({
      where: { id: updatedLocation.id },
      include: {
        admin: { select: { id: true, email: true, companyId: true } },
        lastEditor: { select: { id: true, email: true, companyId: true } },
      },
    });
    return res.status(200).json({ message: "Location updated successfully.", data: fullLocation });
  } catch (error) {
    console.error("Error in updateLocation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/features/locations/:locationId
 * Description: Deletes a location.
 */
const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const location = await prisma.locations.findUnique({ where: { id: Number(locationId) } });
    if (!location) {
      return res.status(404).json({ message: "Location not found." });
    }
    if (location.adminid !== req.user.id) {
      return res.status(403).json({ message: "Forbidden: You do not have permission to delete this location." });
    }
    await prisma.locations.delete({ where: { id: Number(locationId) } });
    return res.status(200).json({ message: "Location deleted successfully." });
  } catch (error) {
    console.error("Error in deleteLocation:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  createLocation,
  getLocations,
  updateLocation,
  deleteLocation,
};
