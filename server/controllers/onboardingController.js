// File: server/controllers/onboardingController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models'); // or wherever your models are

exports.getStarted = async (req, res) => {
  try {
    // Destructure new fields from the request body
    const { firstName, middleName, lastName, email, password, phone, companyName, pax, subscriptionPlanId } = req.body;

    // 1. Hash the password and create new user with all relevant fields
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'admin',  // Adjust role as needed
      // Include any other default fields if necessary
    });

    // 2. Create new company
    const newCompany = await Company.create({
      name: companyName,
      domain: `${companyName.replace(/\s+/g, '').toLowerCase()}.com`,
      // Use additional company fields as needed
    });

    // 3. Link user to the company
    await newUser.update({ companyId: newCompany.id });

    // 4. Generate a JWT token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not set in env.' });
    }
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, companyId: newCompany.id },
      process.env.JWT_SECRET,
      { expiresIn: '10y' }
    );

    // 5. Return token & user data with new fields included
    return res.status(201).json({
      message: 'Account + Company created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        middleName: newUser.middleName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        companyId: newUser.companyId,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('getStarted Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
