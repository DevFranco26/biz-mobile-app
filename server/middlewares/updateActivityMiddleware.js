// File: server/middlewares/updateActivityMiddleware.js
const { prisma } = require("../config/database");

const updateUserActivity = async (req, res, next) => {
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
};

module.exports = updateUserActivity;
