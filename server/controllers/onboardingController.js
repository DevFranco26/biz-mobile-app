// File: server/controllers/onboardingController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Company, Subscription, SubscriptionPlan } = require('../models');
// etc.

exports.getStarted = async (req, res) => {
  try {
    const {
      firstName, middleName, lastName,
      email, password, phone,
      companyName
    } = req.body;

    // 1) Create user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await User.create({
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      role: 'admin'
    });

    // 2) Create company
    const newCompany = await Company.create({
      name: companyName,
      domain: `${companyName.replace(/\s+/g, '').toLowerCase()}.com`
    });

    // Link user to that company
    await newUser.update({ companyId: newCompany.id });

    // 3) Generate token
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: 'JWT_SECRET is not set in env.' });
    }
    const token = jwt.sign(
      { userId: newUser.id, role: newUser.role, companyId: newCompany.id },
      process.env.JWT_SECRET,
      { expiresIn: '10y' }
    );

    // 4) Insert "Free" subscription for that new company
    const freePlan = await SubscriptionPlan.findOne({
      where: { planName: 'Free', rangeOfUsers: '1' }
    });
    if (!freePlan) {
      return res.status(500).json({
        message: 'No free plan found in DB. Please seed a free plan first.'
      });
    }

    const now = new Date();
    const expiration = new Date(now.getTime() + 30*24*60*60*1000); // 30 days
    await Subscription.create({
      companyId: newCompany.id,
      planId: freePlan.id,
      paymentMethod: null,
      paymentDateTime: now,
      expirationDateTime: expiration,
      renewalDateTime: expiration,
      status: 'active'
    });

    // 5) Return success
    return res.status(201).json({
      message: 'Account + Company + Free subscription created successfully.',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        role: newUser.role,
        companyId: newUser.companyId
      }
    });
  } catch (error) {
    console.error('getStarted Error:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};
