// src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/Users.js';

export const signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'role', 'companyId', 'firstName', 'lastName', 'middleName', 'phone', 'password']
    });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not defined in the environment' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send token and user data
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.companyId,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Error in signIn:', err.message || err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const signOut = (req, res) => {
  // For logging out, you can either delete the token from the client-side (frontend)
  console.log('Sign-out');
  res.status(200).json({ message: 'Sign out successfully' });
};
