// File: server/controllers/shiftScheduleController.js

const { ShiftSchedule, User, Company, UserShiftAssignment } = require('../models/index.js');

/**
 * Delete a User from a Shift Schedule
 * DELETE /shift-schedules/:shiftId/assignments/:userId
 */
const deleteUserFromShift = async (req, res) => {
  try {
    const { shiftId, userId } = req.params;
    console.log('deleteUserFromShift - Removing userId:', userId, 'from shiftId:', shiftId);

    // Verify that the shift exists
    const shift = await ShiftSchedule.findByPk(shiftId);
    if (!shift) {
      return res.status(404).json({ message: 'Shift schedule not found.' });
    }

    // Verify that the user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find the UserShiftAssignment
    const assignment = await UserShiftAssignment.findOne({
      where: {
        shiftScheduleId: shiftId,
        userId: userId,
      },
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Delete the assignment
    await assignment.destroy();

    return res.status(200).json({ message: 'User successfully removed from the shift.' });
  } catch (error) {
    console.error('Error in deleteUserFromShift:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get All Shift Schedules
 * Retrieves all shift schedules along with assigned users and their recurrence.
 */
const getAllShiftSchedules = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const shifts = await ShiftSchedule.findAll({
      where: { companyId },
      order: [['id', 'ASC']],
      include: [
        {
          model: User,
          as: 'assignedUsers',
          attributes: ['id', 'firstName', 'middleName', 'lastName'],
          through: {
            attributes: ['recurrence'],
          },
        },
      ],
    });

    res.status(200).json({ message: 'Shift schedules retrieved successfully.', data: shifts });
  } catch (error) {
    console.error('Error in getAllShiftSchedules:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get My Shifts
 * Retrieves the authenticated user's assigned shifts with recurrence and shift details.
 */
const getMyShifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const assignments = await UserShiftAssignment.findAll({
      where: { userId },
      include: [
        {
          model: ShiftSchedule,
          as: 'shiftSchedule',
          attributes: ['id', 'title', 'startTime', 'endTime'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const data = assignments.map(a => {
      // Guard check
      if (!a.shiftSchedule) {
        return null; // or skip this assignment
      }

      return {
        shiftSchedule: {
          id: a.shiftScheduleId,
          title: a.shiftSchedule.title,
          startTime: a.shiftSchedule.startTime,
          endTime: a.shiftSchedule.endTime,
        },
        recurrence: a.recurrence
      };
    }).filter(a => a !== null); // Remove null assignments if any

    res.status(200).json({
      message: 'User shifts retrieved successfully.',
      data
    });
  } catch (error) {
    console.error('Error in getMyShifts:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Create a New Shift Schedule
 * Allows an admin to create a new shift schedule.
 */
const createShiftSchedule = async (req, res) => {
  const { title, startTime, endTime } = req.body;
  const companyId = req.user.companyId;

  if (!title || !startTime || !endTime) {
    return res.status(400).json({ message: 'title, startTime, and endTime are required.' });
  }

  try {
    const newShift = await ShiftSchedule.create({ title, startTime, endTime, companyId });
    res.status(201).json({ message: 'Shift schedule created successfully.', data: newShift });
  } catch (error) {
    console.error('Error in createShiftSchedule:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update an Existing Shift Schedule
 * Allows an admin to update details of an existing shift schedule.
 */
const updateShiftSchedule = async (req, res) => {
  const { id } = req.params;
  const { title, startTime, endTime } = req.body;
  const companyId = req.user.companyId;

  try {
    const shift = await ShiftSchedule.findOne({ where: { id, companyId } });
    if (!shift) {
      return res.status(404).json({ message: 'Shift schedule not found or does not belong to your company.' });
    }

    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (startTime !== undefined) fieldsToUpdate.startTime = startTime;
    if (endTime !== undefined) fieldsToUpdate.endTime = endTime;

    await shift.update(fieldsToUpdate);

    res.status(200).json({ message: 'Shift schedule updated successfully.', data: shift });
  } catch (error) {
    console.error('Error in updateShiftSchedule:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete a Shift Schedule
 * Allows an admin to delete a shift schedule.
 */
const deleteShiftSchedule = async (req, res) => {
  const { id } = req.params;
  const companyId = req.user.companyId;

  try {
    const shift = await ShiftSchedule.findOne({ where: { id, companyId } });
    if (!shift) {
      return res.status(404).json({ message: 'Shift schedule not found or does not belong to your company.' });
    }

    await shift.destroy();
    res.status(200).json({ message: 'Shift schedule deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteShiftSchedule:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Assign a Shift to a User
 * Allows an admin to assign a shift schedule to a user with a specified recurrence.
 */
const assignShiftToUser = async (req, res) => {
  const { id } = req.params; // shiftScheduleId
  const { userId, recurrence } = req.body;
  const companyId = req.user.companyId;
  const requesterId = req.user.id;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required.' });
  }

  if (!recurrence || !['all', 'weekdays', 'weekends'].includes(recurrence)) {
    return res.status(400).json({ message: 'Invalid recurrence. Allowed values: all, weekdays, weekends.' });
  }

  try {
    const shift = await ShiftSchedule.findOne({ where: { id, companyId } });
    if (!shift) {
      return res.status(404).json({ message: 'Shift schedule not found or does not belong to your company.' });
    }

    const user = await User.findOne({ where: { id: userId, companyId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found or does not belong to your company.' });
    }

    const [assignment, created] = await UserShiftAssignment.findOrCreate({
      where: { userId, shiftScheduleId: shift.id },
      defaults: { userId, shiftScheduleId: shift.id, assignedBy: requesterId, recurrence }
    });

    if (!created) {
      // Update recurrence if already assigned
      await assignment.update({ recurrence });
      return res.status(200).json({ message: 'User is already assigned to this shift. Recurrence updated.', data: assignment });
    }

    res.status(201).json({ message: 'Shift assigned to user successfully.', data: assignment });
  } catch (error) {
    console.error('Error in assignShiftToUser:', error);
    res.status(500).json({ message: 'Internal server error.' });
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
