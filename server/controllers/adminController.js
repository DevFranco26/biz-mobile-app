// File: server/controllers/adminController.js

const User = require('../models/Users.js');

/**
 * Get all users belonging to the admin's company.
 */
const getCompanyUsers = async (req, res) => {
  try {
    console.log('Admin get Users:', req.user.id);
    const adminId = req.user.id; 

    // Fetch the admin's companyId
    const admin = await User.findOne({
      where: { id: adminId },
      attributes: ['companyId'],
    });

    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    const companyId = admin.companyId;

    // Fetch all users in the same company
    const users = await User.findAll({
      where: {
        companyId,
        // Uncomment the line below to exclude the admin from the users list
        // id: { [Op.ne]: adminId }, 
      },
      attributes: ['id', 'email', 'firstName', 'middleName', 'lastName', 'phone', 'role', 'status', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({ message: 'Users fetched successfully.', data: users });
  } catch (error) {
    console.error('Error fetching company users:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  getCompanyUsers,
};
