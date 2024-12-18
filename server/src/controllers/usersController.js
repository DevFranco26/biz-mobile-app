// src/controllers/usersController.js

import { User, Company } from '../models/index.js';
import bcrypt from 'bcryptjs';

/**
 * Get all users belonging to the same company as the authenticated user
 */
export const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    // Fetch users with the same companyId, excluding sensitive fields like password
    const users = await User.findAll({
      where: { companyId },
      attributes: { exclude: ['password'] }, // Exclude password from the response
      order: [['id', 'ASC']],
    });

    res.status(200).json({ message: 'Users retrieved successfully.', data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Create a new user
 */
export const createUser = async (req, res) => {
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;

  // Define required fields
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'Email, password, firstName, and lastName are required.' });
  }

  try {
    // Check if the email already exists within the same company
    const existingUser = await User.findOne({ where: { email, companyId: req.user.companyId } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email in your company.' });
    }

    // Hash the password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Determine the companyId: if superAdmin, allow specifying companyId; else, use requester's companyId
    let targetCompanyId = req.user.companyId;
    if (req.user.role === 'superAdmin' && companyId) {
      // Verify that the provided companyId exists
      const companyExists = await Company.findByPk(companyId);
      if (!companyExists) {
        return res.status(400).json({ message: 'Invalid companyId provided.' });
      }
      targetCompanyId = companyId;
    }

    // Create the new user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'user',
      firstName,
      middleName,
      lastName,
      phone,
      status: status !== undefined ? status : true, // Default to active if not provided
      companyId: targetCompanyId,
    });

    // Exclude password from the response
    const { password: pwd, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json({ message: 'User created successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update an existing user (including role change)
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;

  try {
    // Ensure the authenticated user has a company associated
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    // Find the user to be updated within the same company
    const user = await User.findOne({ where: { id, companyId: requesterCompanyId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found or does not belong to your company.' });
    }

    // Define editable fields based on requester role
    const editableFieldsByRole = {
      admin: ['firstName', 'middleName', 'lastName', 'email', 'phone', 'status'],
      superAdmin: ['firstName', 'middleName', 'lastName', 'email', 'phone', 'status', 'role', 'companyId'],
    };

    // Determine the requester's role
    const requesterRole = req.user.role;

    if (!['admin', 'superAdmin'].includes(requesterRole)) {
      // If the role is not authorized to update users
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    // Get the list of fields the requester is allowed to edit
    const allowedFields = editableFieldsByRole[requesterRole];

    // Initialize an object to hold the fields to update
    let fieldsToUpdate = {};

    // Iterate over allowed fields and add to fieldsToUpdate if present in the request body
    allowedFields.forEach((field) => {
      if (req.body.hasOwnProperty(field)) {
        fieldsToUpdate[field] = req.body[field];
      }
    });

    // Handle password update if provided
    if (password) {
      fieldsToUpdate.password = bcrypt.hashSync(password, 10);
    }

    // Prevent updating immutable fields explicitly
    const immutableFields = ['id', 'createdAt', 'updatedAt'];
    immutableFields.forEach((field) => {
      if (fieldsToUpdate.hasOwnProperty(field)) {
        delete fieldsToUpdate[field];
      }
    });

    // Check for email uniqueness if email is being updated
    if (fieldsToUpdate.email && fieldsToUpdate.email !== user.email) {
      const emailExists = await User.findOne({ where: { email: fieldsToUpdate.email } });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(409).json({ message: 'Another user already has this email.' });
      }
    }

    // Check for valid companyId if it's being updated by superAdmin
    if (fieldsToUpdate.companyId) {
      const companyExists = await Company.findByPk(fieldsToUpdate.companyId);
      if (!companyExists) {
        return res.status(400).json({ message: 'Invalid companyId provided.' });
      }
    }

    // Update the user with allowed fields
    await user.update(fieldsToUpdate, { fields: Object.keys(fieldsToUpdate) });

    // Exclude password from the response
    const { password: pwd, ...userWithoutPassword } = user.toJSON();

    res.status(200).json({ message: 'User updated successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Delete a user
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the authenticated user has a company associated
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    // Find the user to be deleted within the same company
    const user = await User.findOne({ where: { id, companyId: requesterCompanyId } });

    if (!user) {
      return res.status(404).json({ message: 'User not found or does not belong to your company.' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
