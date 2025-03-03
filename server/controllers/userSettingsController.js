// File: server/controllers/userSettingsController.js
const { prisma } = require("../config/database");

// Assign or update location restriction for a user.
const assignLocationToUser = async (req, res) => {
  const { userId, locationId, restrictionEnabled } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { id: Number(userId) },
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (restrictionEnabled && !locationId)
      return res.status(400).json({
        message: "Location ID is required when enabling restriction.",
      });
    let location = null;
    if (restrictionEnabled && locationId) {
      location = await prisma.locations.findUnique({
        where: { id: Number(locationId) },
      });
      if (!location) return res.status(404).json({ message: "Location not found." });
    }
    let setting = await prisma.userSettings.findFirst({
      where: { userId: Number(userId) },
    });
    if (setting) {
      setting = await prisma.userSettings.update({
        where: { id: setting.id },
        data: {
          restrictionenabled: restrictionEnabled,
          locationId: restrictionEnabled ? Number(locationId) : null,
        },
      });
      return res.status(200).json({ message: "User setting updated successfully.", data: setting });
    } else {
      if (!restrictionEnabled)
        return res.status(400).json({
          message: "Cannot disable restriction without an existing setting.",
        });
      setting = await prisma.userSettings.create({
        data: {
          userId: Number(userId),
          restrictionenabled: restrictionEnabled,
          locationId: Number(locationId),
        },
      });
      return res.status(201).json({ message: "User setting created successfully.", data: setting });
    }
  } catch (error) {
    console.error("Error in assignLocationToUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Toggle location restriction for a user.
const toggleLocationRestriction = async (req, res) => {
  const { userId } = req.body;
  try {
    const setting = await prisma.userSettings.findFirst({
      where: { userId: Number(userId) },
    });
    if (!setting)
      return res.status(404).json({
        message: "User setting not found. Cannot toggle restriction.",
      });
    const updatedSetting = await prisma.userSettings.update({
      where: { id: setting.id },
      data: { restrictionenabled: !setting.restrictionenabled },
    });
    return res.status(200).json({
      message: "Location restriction toggled successfully.",
      data: updatedSetting,
    });
  } catch (error) {
    console.error("Error in toggleLocationRestriction:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get all user settings.
const getUserSettings = async (req, res) => {
  const { userId } = req.query;
  try {
    const settings = await prisma.userSettings.findMany({
      where: { userId: Number(userId) },
      include: { location: true },
    });
    return res.status(200).json({
      message: "User settings retrieved successfully.",
      data: settings,
    });
  } catch (error) {
    console.error("Error in getUserSettings:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  assignLocationToUser,
  toggleLocationRestriction,
  getUserSettings,
};
