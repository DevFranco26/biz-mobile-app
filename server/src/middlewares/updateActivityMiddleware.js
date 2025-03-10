// File: src/middlewares/updateActivityMiddleware.js
/**
 * Update Activity Middleware
 * --------------------------
 * Updates the last active timestamp and sets the presence status to "active" for the authenticated employee.
 */
const { prisma } = require("@config/database");

async function updateUserActivity(req, res, next) {
  if (req.user && req.user.id) {
    try {
      await prisma.users.update({
        where: { id: req.user.id },
        data: { lastActiveAt: new Date(), presenceStatus: "active" },
      });
    } catch (err) {
      console.error("Error updating user activity:", err);
    }
  }
  next();
}

module.exports = updateUserActivity;
