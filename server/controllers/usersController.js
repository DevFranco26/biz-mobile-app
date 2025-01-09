// File: server/controllers/usersController.js

const { User, Company } = require('../models/index.js');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * Compute Presence Status based on lastActiveAt
 * Determines the user's presence status and tooltip based on their last active time.
 * @param {string} presenceStatus - Current presence status ('active', 'away', 'offline')
 * @param {Date} lastActiveAt - Timestamp of the last activity
 * @returns {object} - Object containing finalStatus and tooltip
 */
const computePresenceStatus = (presenceStatus, lastActiveAt) => {
  // If user manually set offline, respect that
  if (presenceStatus === 'offline') {
    return { finalStatus: 'offline', tooltip: 'Offline' };
  }
  
  // If user manually set away, show away and how long ago
  if (presenceStatus === 'away') {
    const tooltip = computeTooltip(lastActiveAt);
    return { finalStatus: 'away', tooltip };
  }
  
  // If presenceStatus is active, then apply time-based logic
  if (presenceStatus === 'active') {
    if (!lastActiveAt) {
      return { finalStatus: 'offline', tooltip: 'Offline' };
    }
    
    const now = Date.now();
    const diff = now - new Date(lastActiveAt).getTime();
    const fiveMin = 5 * 60 * 1000;   
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff <= fiveMin) {
      // Within 5 minutes: Active now
      return { finalStatus: 'active', tooltip: 'Active now' };
    } else if (diff <= oneDay) {
      // Between 5 minutes and 24 hours: Away
      const tooltip = computeTooltip(lastActiveAt);
      return { finalStatus: 'away', tooltip };
    } else {
      // More than 24 hours: Offline
      return { finalStatus: 'offline', tooltip: 'Offline' };
    }
  }

  // Fallback
  return { finalStatus: 'offline', tooltip: 'Offline' };
};

/**
 * Helper Function: Compute Tooltip based on lastActiveAt
 * Generates a human-readable tooltip message.
 * @param {Date} lastActiveAt - Timestamp of the last activity
 * @returns {string} - Tooltip message
 */
const computeTooltip = (lastActiveAt) => {
  if (!lastActiveAt) return 'Offline';
  
  const now = Date.now();
  const diffMs = now - new Date(lastActiveAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minutes ago`;
  } else {
    // More than 60 minutes, show date/time
    const lastActiveDate = new Date(lastActiveAt);
    return `Last seen: ${lastActiveDate.toLocaleString()}`;
  }
};

/**
 * Get All Users
 * Retrieves all users belonging to the same company as the authenticated user, excluding themselves.
 */
const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    // Exclude the currently logged in user from the results
    const users = await User.findAll({
      where: {
        companyId,
        id: { [Op.ne]: req.user.id } // Exclude current user's ID
      },
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
    });

    const usersWithPresence = users.map(user => {
      const userJson = user.toJSON();
      const { finalStatus, tooltip } = computePresenceStatus(userJson.presenceStatus, userJson.lastActiveAt);
      userJson.presenceStatus = finalStatus;
      userJson.presenceTooltip = tooltip;
      return userJson;
    });

    res.status(200).json({ message: 'Users retrieved successfully.', data: usersWithPresence });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Create a New User
 * Allows an admin or superAdmin to create a new user within their company.
 */
const createUser = async (req, res) => {
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Email, password, firstName, and lastName are required.' });
  }

  try {
    const existingUser = await User.findOne({ where: { email, companyId: req.user.companyId } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email in your company.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    let targetCompanyId = req.user.companyId;
    if (req.user.role === 'superAdmin' && companyId) {
      const companyExists = await Company.findByPk(companyId);
      if (!companyExists) {
        return res.status(400).json({ message: 'Invalid companyId provided.' });
      }
      targetCompanyId = companyId;
    }

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'user',
      firstName,
      middleName,
      lastName,
      phone,
      status: status !== undefined ? status : true,
      companyId: targetCompanyId,
      lastActiveAt: new Date(),
      presenceStatus: 'active',
    });

    const { password: pwd, ...userWithoutPassword } = newUser.toJSON();
    res.status(201).json({ message: 'User created successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update an Existing User
 * Allows an admin or superAdmin to update a user's details.
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;

  try {
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const user = await User.findOne({ where: { id, companyId: requesterCompanyId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found or does not belong to your company.' });
    }

    const editableFieldsByRole = {
      admin: ['firstName', 'middleName', 'lastName', 'email', 'phone', 'status'],
      superAdmin: ['firstName', 'middleName', 'lastName', 'email', 'phone', 'status', 'role', 'companyId'],
    };

    const requesterRole = req.user.role;

    if (!['admin', 'superAdmin'].includes(requesterRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    const allowedFields = editableFieldsByRole[requesterRole];
    let fieldsToUpdate = {};

    allowedFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    if (password) {
      fieldsToUpdate.password = bcrypt.hashSync(password, 10);
    }

    const immutableFields = ['id', 'createdAt', 'updatedAt'];
    immutableFields.forEach((field) => {
      if (fieldsToUpdate.hasOwnProperty(field)) {
        delete fieldsToUpdate[field];
      }
    });

    if (fieldsToUpdate.email && fieldsToUpdate.email !== user.email) {
      const emailExists = await User.findOne({ where: { email: fieldsToUpdate.email } });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(409).json({ message: 'Another user already has this email.' });
      }
    }

    if (fieldsToUpdate.companyId) {
      const companyExists = await Company.findByPk(fieldsToUpdate.companyId);
      if (!companyExists) {
        return res.status(400).json({ message: 'Invalid companyId provided.' });
      }
    }

    await user.update(fieldsToUpdate, { fields: Object.keys(fieldsToUpdate) });

    const { password: pwd, ...userWithoutPassword } = user.toJSON();
    res.status(200).json({ message: 'User updated successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete a User
 * Allows an admin or superAdmin to delete a user from their company.
 */
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const user = await User.findOne({ where: { id, companyId: requesterCompanyId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found or does not belong to your company.' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update User's Presence Status
 * Allows a user to update their own presence status.
 */
const updateUserPresence = async (req, res) => {
  const { presenceStatus } = req.body;

  // Allowed statuses: active, away, offline
  const allowedStatuses = ['active', 'away', 'offline'];
  if (!allowedStatuses.includes(presenceStatus)) {
    return res.status(400).json({ message: 'Invalid presence status. Allowed values: active, away, offline.' });
  }

  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ message: 'Authenticated user not found.' });
    }

    let fieldsToUpdate = { presenceStatus };
    if (presenceStatus === 'active' || presenceStatus === 'away') {
      fieldsToUpdate.lastActiveAt = new Date();
    } else if (presenceStatus === 'offline') {
      fieldsToUpdate.lastActiveAt = null;
    }

    await user.update(fieldsToUpdate);

    const { password: pwd, ...userWithoutPassword } = user.toJSON();
    return res.status(200).json({ message: 'Presence status updated successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error in updateUserPresence:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Change the authenticated user's password
 */
const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields (oldPassword, newPassword, confirmPassword) are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New password and confirm password do not match.' });
    }

    // Fetch the authenticated user
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if oldPassword matches current password
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }

    // Update with new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change Password Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPresence,
  changeUserPassword
};
