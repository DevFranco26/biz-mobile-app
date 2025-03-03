// File: server/controllers/timeLogsController.js
const { prisma } = require("../config/database");

// Calculate distance using the Haversine formula.
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Record time-in for a user.
const timeIn = async (req, res) => {
  const { userId, deviceInfo, location, timeZone } = req.body;
  const timeInAt = new Date();
  try {
    const activeLog = await prisma.timeLogs.findFirst({
      where: { userId, status: true },
    });
    if (activeLog) return res.status(400).json({ message: "User is already time-in." });
    const userSettings = await prisma.userSettings.findMany({
      where: { userId, restrictionenabled: true },
      include: { location: true },
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
    if (!isWithinAllowedLocation) return res.status(400).json({ message: "Punch location is outside allowed areas." });
    const newLog = await prisma.timeLogs.create({
      data: {
        userId,
        timeInAt,
        timeInTimeZone: timeZone,
        status: true,
        timeInDevice: deviceInfo,
        timeInLat: location.latitude,
        timeInLong: location.longitude,
      },
    });
    await prisma.users.update({
      where: { id: userId },
      data: { status: true },
    });
    return res.status(201).json({ message: "Time-in recorded successfully.", data: newLog });
  } catch (error) {
    console.error("Error in timeIn:", error);
    return res.status(500).json({ message: "Internal server error during time-in." });
  }
};

// Record time-out for a user.
const timeOut = async (req, res) => {
  const { userId, deviceInfo, location, timeZone } = req.body;
  const timeOutAt = new Date();
  try {
    const activeLog = await prisma.timeLogs.findFirst({
      where: { userId, status: true },
      orderBy: { createdAt: "desc" },
    });
    if (!activeLog) return res.status(400).json({ message: "No active time-in found." });
    const userSettings = await prisma.userSettings.findMany({
      where: { userId, restrictionenabled: true },
      include: { location: true },
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
    if (!isWithinAllowedLocation) return res.status(400).json({ message: "Punch location is outside allowed areas." });
    await prisma.timeLogs.update({
      where: { id: activeLog.id },
      data: {
        timeOutAt,
        timeOutTimeZone: timeZone,
        status: false,
        timeOutDevice: deviceInfo,
        timeOutLat: location.latitude,
        timeOutLong: location.longitude,
      },
    });
    let totalHours = 0;
    if (activeLog.lunchBreakStart && activeLog.lunchBreakEnd) {
      const totalTime = timeOutAt - activeLog.timeInAt;
      const breakTime = new Date(activeLog.lunchBreakEnd) - new Date(activeLog.lunchBreakStart);
      if (breakTime < 0) return res.status(400).json({ message: "Invalid lunch break times." });
      totalHours = (totalTime - breakTime) / (1000 * 60 * 60);
    } else {
      totalHours = (timeOutAt - activeLog.timeInAt) / (1000 * 60 * 60);
    }
    totalHours = Math.round(totalHours * 100) / 100;
    const finalLog = await prisma.timeLogs.update({
      where: { id: activeLog.id },
      data: { totalHours },
    });
    await prisma.users.update({
      where: { id: userId },
      data: { status: false },
    });
    return res.status(200).json({ message: "Time-out recorded successfully.", data: finalLog });
  } catch (error) {
    console.error("Error in timeOut:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get monthly time logs.
const getMonthlyLogs = async (req, res) => {
  const { userId, year, month } = req.query;
  try {
    const firstDate = new Date(Date.UTC(year, month - 1, 1));
    const lastDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));
    const logs = await prisma.timeLogs.findMany({
      where: {
        userId: Number(userId),
        timeInAt: { gte: firstDate, lte: lastDate },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.status(200).json({ message: "Logs retrieved successfully.", data: logs });
  } catch (error) {
    console.error("Error in getMonthlyLogs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get time logs in a date range.
const getRangeLogs = async (req, res) => {
  let { userId, startDate, endDate } = req.query;
  try {
    const requestingUser = await prisma.users.findUnique({
      where: { id: req.user.id },
    });
    if (!requestingUser) return res.status(404).json({ message: "Requesting user not found." });
    if (requestingUser.role !== "admin" && requestingUser.role !== "superadmin") {
      userId = req.user.id;
    } else {
      if (!userId) userId = req.user.id;
      else {
        const targetUser = await prisma.users.findUnique({
          where: { id: Number(userId) },
        });
        if (!targetUser) return res.status(404).json({ message: "Target user not found." });
        if (targetUser.companyId !== requestingUser.companyId)
          return res.status(403).json({
            message: "Access denied: User belongs to a different company.",
          });
      }
    }
    if (!startDate || !endDate) return res.status(400).json({ message: "startDate and endDate are required." });
    const logs = await prisma.timeLogs.findMany({
      where: {
        userId: Number(userId),
        timeInAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      orderBy: { createdAt: "asc" },
    });
    return res.status(200).json({ message: "Logs retrieved successfully.", data: logs });
  } catch (error) {
    console.error("Error in getRangeLogs:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get the latest time log for a user.
const getUserTimeLog = async (req, res) => {
  const { userId } = req.params;
  try {
    const timeLog = await prisma.timeLogs.findFirst({
      where: { userId: Number(userId) },
      orderBy: { createdAt: "desc" },
    });
    if (!timeLog) return res.status(404).json({ message: "No time log found for this user." });
    return res.status(200).json({ message: "Time log fetched successfully.", data: timeLog });
  } catch (error) {
    console.error("Error in getUserTimeLog:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Toggle coffee break status.
const coffeeBreakToggle = async (req, res) => {
  try {
    const { userId } = req.body;
    const activeLog = await prisma.timeLogs.findFirst({
      where: { userId, status: true },
      orderBy: { createdAt: "desc" },
    });
    if (!activeLog) return res.status(400).json({ message: "No active time-in found." });
    if (!activeLog.coffeeBreakStart) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreakStart: new Date() },
      });
      return res.status(200).json({ message: "Coffee break #1 started.", data: updatedLog });
    }
    if (activeLog.coffeeBreakStart && !activeLog.coffeeBreakEnd) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreakEnd: new Date() },
      });
      return res.status(200).json({ message: "Coffee break #1 ended.", data: updatedLog });
    }
    if (!activeLog.coffeeBreak2Start) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreak2Start: new Date() },
      });
      return res.status(200).json({ message: "Coffee break #2 started.", data: updatedLog });
    }
    if (activeLog.coffeeBreak2Start && !activeLog.coffeeBreak2End) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreak2End: new Date() },
      });
      return res.status(200).json({ message: "Coffee break #2 ended.", data: updatedLog });
    }
    return res.status(400).json({ message: "Max coffee breaks used for this shift." });
  } catch (error) {
    console.error("Error in coffeeBreakToggle:", error);
    return res.status(500).json({ message: "Internal server error toggling coffee break." });
  }
};

// Toggle lunch break status.
const lunchBreakToggle = async (req, res) => {
  try {
    const { userId } = req.body;
    const activeLog = await prisma.timeLogs.findFirst({
      where: { userId, status: true },
      orderBy: { createdAt: "desc" },
    });
    if (!activeLog) return res.status(400).json({ message: "No active time-in found." });
    if (activeLog.coffeeBreakStart && !activeLog.coffeeBreakEnd) {
      await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreakEnd: new Date() },
      });
    } else if (activeLog.coffeeBreak2Start && !activeLog.coffeeBreak2End) {
      await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { coffeeBreak2End: new Date() },
      });
    }
    if (!activeLog.lunchBreakStart) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { lunchBreakStart: new Date() },
      });
      return res.status(200).json({ message: "Lunch break started.", data: updatedLog });
    }
    if (activeLog.lunchBreakStart && !activeLog.lunchBreakEnd) {
      const updatedLog = await prisma.timeLogs.update({
        where: { id: activeLog.id },
        data: { lunchBreakEnd: new Date() },
      });
      return res.status(200).json({ message: "Lunch break ended.", data: updatedLog });
    }
    return res.status(400).json({ message: "Lunch break already used for this shift." });
  } catch (error) {
    console.error("Error in lunchBreakToggle:", error);
    return res.status(500).json({ message: "Internal server error toggling lunch break." });
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
