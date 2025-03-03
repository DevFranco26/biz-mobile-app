// File: server/controllers/shiftScheduleController.js
const { prisma } = require("../config/database");

// Remove a user from a shift schedule.
const deleteUserFromShift = async (req, res) => {
  try {
    const shiftId = Number(req.params.shiftId);
    const userId = Number(req.params.userId);
    const shift = await prisma.shiftSchedules.findUnique({
      where: { id: shiftId },
    });
    if (!shift) return res.status(404).json({ message: "Shift schedule not found." });
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ message: "User not found." });
    const assignment = await prisma.userShiftAssignments.findFirst({
      where: { shiftScheduleId: shiftId, userId },
    });
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });
    await prisma.userShiftAssignments.delete({ where: { id: assignment.id } });
    return res.status(200).json({ message: "User successfully removed from the shift." });
  } catch (error) {
    console.error("Error in deleteUserFromShift:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Retrieve all shift schedules for the company.
const getAllShiftSchedules = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const shifts = await prisma.shiftSchedules.findMany({
      where: { companyId },
      orderBy: { id: "asc" },
      include: {
        UserShiftAssignments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                middleName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
    return res.status(200).json({
      message: "Shift schedules retrieved successfully.",
      data: shifts,
    });
  } catch (error) {
    console.error("Error in getAllShiftSchedules:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Retrieve shifts assigned to the authenticated user.
const getMyShifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await prisma.userShiftAssignments.findMany({
      where: { userId },
      include: {
        shiftSchedule: {
          select: { id: true, title: true, startTime: true, endTime: true },
        },
      },
      orderBy: { id: "asc" },
    });
    const data = assignments.map((a) => (a.shiftSchedule ? { shiftSchedule: a.shiftSchedule, recurrence: a.recurrence } : null)).filter((a) => a !== null);
    return res.status(200).json({ message: "User shifts retrieved successfully.", data });
  } catch (error) {
    console.error("Error in getMyShifts:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Create a new shift schedule.
const createShiftSchedule = async (req, res) => {
  const { title, startTime, endTime } = req.body;
  const companyId = req.user.companyId;
  if (!title || !startTime || !endTime) return res.status(400).json({ message: "title, startTime, and endTime are required." });
  try {
    const newShift = await prisma.shiftSchedules.create({
      data: {
        title,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        companyId,
      },
    });
    return res.status(201).json({
      message: "Shift schedule created successfully.",
      data: newShift,
    });
  } catch (error) {
    console.error("Error in createShiftSchedule:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update an existing shift schedule.
const updateShiftSchedule = async (req, res) => {
  const id = Number(req.params.id);
  const { title, startTime, endTime } = req.body;
  const companyId = req.user.companyId;
  try {
    const shift = await prisma.shiftSchedules.findFirst({
      where: { id, companyId },
    });
    if (!shift)
      return res.status(404).json({
        message: "Shift schedule not found or does not belong to your company.",
      });
    const data = {};
    if (title !== undefined) data.title = title;
    if (startTime !== undefined) data.startTime = new Date(startTime);
    if (endTime !== undefined) data.endTime = new Date(endTime);
    const updatedShift = await prisma.shiftSchedules.update({
      where: { id },
      data,
    });
    return res.status(200).json({
      message: "Shift schedule updated successfully.",
      data: updatedShift,
    });
  } catch (error) {
    console.error("Error in updateShiftSchedule:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a shift schedule.
const deleteShiftSchedule = async (req, res) => {
  const id = Number(req.params.id);
  const companyId = req.user.companyId;
  try {
    const shift = await prisma.shiftSchedules.findFirst({
      where: { id, companyId },
    });
    if (!shift)
      return res.status(404).json({
        message: "Shift schedule not found or does not belong to your company.",
      });
    await prisma.shiftSchedules.delete({ where: { id } });
    return res.status(200).json({ message: "Shift schedule deleted successfully." });
  } catch (error) {
    console.error("Error in deleteShiftSchedule:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Assign a shift to a user.
const assignShiftToUser = async (req, res) => {
  const shiftScheduleId = Number(req.params.id);
  const { userId, recurrence } = req.body;
  const companyId = req.user.companyId;
  const requesterId = req.user.id;
  if (!userId) return res.status(400).json({ message: "userId is required." });
  if (!recurrence || !["all", "weekdays", "weekends"].includes(recurrence))
    return res.status(400).json({
      message: "Invalid recurrence. Allowed values: all, weekdays, weekends.",
    });
  try {
    const shift = await prisma.shiftSchedules.findFirst({
      where: { id: shiftScheduleId, companyId },
    });
    if (!shift)
      return res.status(404).json({
        message: "Shift schedule not found or does not belong to your company.",
      });
    const user = await prisma.users.findFirst({
      where: { id: Number(userId), companyId },
    });
    if (!user)
      return res.status(404).json({
        message: "User not found or does not belong to your company.",
      });
    let assignment = await prisma.userShiftAssignments.findFirst({
      where: { userId: Number(userId), shiftScheduleId },
    });
    if (assignment) {
      assignment = await prisma.userShiftAssignments.update({
        where: { id: assignment.id },
        data: { recurrence },
      });
      return res.status(200).json({
        message: "User is already assigned to this shift. Recurrence updated.",
        data: assignment,
      });
    }
    assignment = await prisma.userShiftAssignments.create({
      data: {
        userId: Number(userId),
        shiftScheduleId,
        assignedBy: requesterId,
        recurrence,
      },
    });
    return res.status(201).json({
      message: "Shift assigned to user successfully.",
      data: assignment,
    });
  } catch (error) {
    console.error("Error in assignShiftToUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  deleteUserFromShift,
  getAllShiftSchedules,
  getMyShifts,
  createShiftSchedule,
  updateShiftSchedule,
  deleteShiftSchedule,
  assignShiftToUser,
};
