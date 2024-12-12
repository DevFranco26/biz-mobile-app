// src/controllers/usersController.js

import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';

// Get all users belonging to the same company as the authenticated user
export const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    // Only fetch users with the same companyId
    const users = await User.findAll({
      where: { companyId },
      order: [['id', 'ASC']],
    });

    res.status(200).json({ message: 'Users retrieved successfully.', data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  const { email, password, role, firstName, middleName, lastName, phone, status } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    // Ensure the new user is created under the same company as the admin creating them
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const newUser = await User.create({
      email,
      password: hashedPassword,
      role: role || 'user',
      firstName,
      middleName,
      lastName,
      phone,
      status: status ?? false,
      companyId,
    });

    res.status(201).json({ message: 'User created successfully.', data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update an existing user (including role change)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role, firstName, middleName, lastName, phone, status } = req.body;

  try {
    // First, fetch the user and ensure they belong to the same company as the requester
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const user = await User.findOne({ where: { id, companyId } });

    if (!user) return res.status(404).json({ message: 'User not found or does not belong to your company.' });

    // Update fields if provided
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ where: { email } });
      if (emailExists && emailExists.id !== user.id) {
        return res.status(409).json({ message: 'Another user already has this email.' });
      }
      user.email = email;
    }

    if (password) {
      user.password = bcrypt.hashSync(password, 10);
    }

    if (role) user.role = role;
    if (firstName !== undefined) user.firstName = firstName;
    if (middleName !== undefined) user.middleName = middleName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (status !== undefined) user.status = status;

    await user.save();

    res.status(200).json({ message: 'User updated successfully.', data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    // Ensure the user being deleted belongs to the same company
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const user = await User.findOne({ where: { id, companyId } });
    if (!user) return res.status(404).json({ message: 'User not found or does not belong to your company.' });

    await user.destroy();
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
