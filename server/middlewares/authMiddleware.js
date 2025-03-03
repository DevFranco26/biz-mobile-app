// File: server/middlewares/authMiddleware.js
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("Authenticate Token Auth Header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access token missing." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) return res.status(401).json({ message: "User not found." });
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };
    next();
  } catch (error) {
    console.error("Authentication Error:", error);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

module.exports = authenticateToken;
