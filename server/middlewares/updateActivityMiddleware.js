// File: server/middlewares/updateActivityMiddleware.js

const { User } = require('../models/index.js');

const updateUserActivity = async (req, res, next) => {
  if (req.user && req.user.id) {
    try {
      const user = await User.findByPk(req.user.id);
      if (user) {
        // Update lastActiveAt and presenceStatus to active on each request
        await user.update({ lastActiveAt: new Date(), presenceStatus: 'active' });
      }
    } catch (err) {
      console.error('Error updating user activity:', err);
      // Don't block the request, just log the error
    }
  }
  next();
};

module.exports = updateUserActivity;
