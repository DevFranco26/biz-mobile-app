// File: src/middlewares/roleMiddleware.js
const { prisma } = require("@config/database");

function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      console.log("authorizeRoles middleware invoked");
      console.log("Allowed roles:", allowedRoles);
      console.log("Request user from token:", req.user);

      if (!req.user || !req.user.id) {
        console.log("No user information found on request.");
        return res.status(403).json({ message: "Access denied: insufficient permissions." });
      }

      // Fetch the full user record from the database
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      console.log("Fetched user from database:", user);
      if (!user) {
        console.log("User not found in database.");
        return res.status(403).json({ message: "Access denied: user not found." });
      }
      if (!allowedRoles.includes(user.role)) {
        console.log("User does not have permission. User role:", user.role, "Allowed roles:", allowedRoles);
        return res.status(403).json({ message: "Access denied: insufficient permissions." });
      }

      // Attach the full user record to req.user for further use
      req.user = user;
      console.log("User authorized. Continuing to next middleware/route handler.");
      next();
    } catch (error) {
      console.error("Error in role middleware:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };
}

module.exports = { authorizeRoles };
