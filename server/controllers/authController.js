// File: server/controllers/authController.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users.js');

/**
 * Sign In Controller
 * Authenticates a user and returns a JWT token along with user details.
 */
const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'role', 'companyId', 'departmentId', 'firstName', 'lastName', 'middleName', 'phone', 'password', 'lastActiveAt', 'presenceStatus']
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not defined in the environment.' });
    }

    // Update lastActiveAt and presenceStatus to active upon login
    await user.update({
      lastActiveAt: new Date(),
      presenceStatus: 'active'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId, departmentId: user.departmentId },
      process.env.JWT_SECRET,
      { expiresIn: '10y' }
    );

    // Send token and user data
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Error in signIn:', err.message || err);
    res.status(500).json({ message: 'Server error.' });
  }
};

/**
 * Sign Out Controller
 * Logs out a user by responding with a success message.
 */
const signOut = (req, res) => {
  console.log('Sign-out');
  res.status(200).json({ message: 'Signed out successfully.' });
};

/**
 * Get Current User Controller
 * Retrieves the authenticated user's details.
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.user.id },
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({
      message: 'User retrieved successfully.',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone,
        presenceStatus: user.presenceStatus,
        lastActiveAt: user.lastActiveAt
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Update Current User Controller
 * Allows the authenticated user to update their personal details.
 */
const updateCurrentUser = async (req, res) => {
  const { firstName, middleName, lastName, phone } = req.body;

  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update only allowed fields
    const fieldsToUpdate = {};
    if (firstName !== undefined) fieldsToUpdate.firstName = firstName;
    if (middleName !== undefined) fieldsToUpdate.middleName = middleName;
    if (lastName !== undefined) fieldsToUpdate.lastName = lastName;
    if (phone !== undefined) fieldsToUpdate.phone = phone;

    await user.update(fieldsToUpdate);

    const { password: pwd, ...userWithoutPassword } = user.toJSON();
    res.status(200).json({ message: 'User updated successfully.', data: userWithoutPassword });
  } catch (error) {
    console.error('Error updating current user:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  signIn,
  signOut,
  getCurrentUser,
  updateCurrentUser,
};
