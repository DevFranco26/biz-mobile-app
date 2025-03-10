// File: src/controllers/Features/employeeLocationRestrictionController.js
const { prisma } = require("@config/database");

/**
 * POST /api/features/employee-location-restriction/assign
 * Description: Assigns or updates the location restriction for an employee.
 */
const assignLocationToEmployee = async (req, res) => {
  try {
    const { employeeId, locationId, restrictionEnabled } = req.body;
    // Find the employee by ID
    const employee = await prisma.users.findUnique({ where: { id: Number(employeeId) } });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    // When enabling restriction, a location ID must be provided
    if (restrictionEnabled && !locationId) {
      return res.status(400).json({ message: "Location ID is required when enabling restriction." });
    }
    // If a location is provided, validate it exists
    let location = null;
    if (restrictionEnabled && locationId) {
      location = await prisma.locations.findUnique({ where: { id: Number(locationId) } });
      if (!location) {
        return res.status(404).json({ message: "Location not found." });
      }
    }
    // Look for an existing employee location restriction setting
    let setting = await prisma.employeeLocationRestriction.findFirst({
      where: { employeeId: Number(employeeId) },
    });
    if (setting) {
      // Update the existing setting
      setting = await prisma.employeeLocationRestriction.update({
        where: { id: setting.id },
        data: {
          restrictionEnabled: restrictionEnabled,
          locationId: restrictionEnabled ? Number(locationId) : null,
        },
      });
      return res.status(200).json({ message: "Employee location restriction updated successfully.", data: setting });
    } else {
      // If no setting exists and restriction is to be disabled, return an error
      if (!restrictionEnabled) {
        return res.status(400).json({ message: "Cannot disable restriction without an existing setting." });
      }
      // Otherwise, create a new setting
      setting = await prisma.employeeLocationRestriction.create({
        data: {
          employeeId: Number(employeeId),
          restrictionEnabled: restrictionEnabled,
          locationId: Number(locationId),
        },
      });
      return res.status(201).json({ message: "Employee location restriction created successfully.", data: setting });
    }
  } catch (error) {
    console.error("Error in assignLocationToEmployee:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/features/employee-location-restriction/toggle
 * Description: Toggles the location restriction for an employee.
 */
const toggleLocationRestriction = async (req, res) => {
  try {
    const { employeeId } = req.body;
    // Find the existing restriction setting for the employee
    const setting = await prisma.employeeLocationRestriction.findFirst({
      where: { employeeId: Number(employeeId) },
    });
    if (!setting) {
      return res.status(404).json({ message: "Employee location restriction not found. Cannot toggle restriction." });
    }
    // Toggle the restrictionEnabled flag
    const updatedSetting = await prisma.employeeLocationRestriction.update({
      where: { id: setting.id },
      data: { restrictionEnabled: !setting.restrictionEnabled },
    });
    return res.status(200).json({ message: "Employee location restriction toggled successfully.", data: updatedSetting });
  } catch (error) {
    console.error("Error in toggleLocationRestriction:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/employee-location-restriction
 * Description: Retrieves the location restriction settings for an employee.
 */
const getEmployeeLocationRestriction = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const settings = await prisma.employeeLocationRestriction.findMany({
      where: { employeeId: Number(employeeId) },
      include: { location: true },
    });
    return res.status(200).json({ message: "Employee location restriction retrieved successfully.", data: settings });
  } catch (error) {
    console.error("Error in getEmployeeLocationRestriction:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  assignLocationToEmployee,
  toggleLocationRestriction,
  getEmployeeLocationRestriction,
};
