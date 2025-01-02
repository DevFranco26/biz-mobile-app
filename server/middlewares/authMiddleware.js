// File: server/middlewares/authMiddleware.js

const jwt = require('jsonwebtoken');
const { User } = require('../models/index.js');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Authenticate Token Auth Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token missing.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch the user from the database to attach full user details
    const user = await User.findOne({ where: { id: decoded.userId } }); 

    if (!user) {
      return res.status(401).json({ message: 'User not found.' });
    }

    // Attach user to the request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      // Add other necessary fields
    };

    next();
  } catch (error) {
    console.error('Authentication Error:', error);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authenticateToken;
