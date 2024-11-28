import jwt from 'jsonwebtoken';

// Middleware to verify the JWT token
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.header('Authorization')?.split(' ')[1];

  if (!token) return res.status(403).json({ message: 'Access denied, token missing' });

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });

    req.user = user; // Attach user info to request
    next();
  });
};

export default authenticateToken;
