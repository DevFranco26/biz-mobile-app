// File: server/controllers/departmentController.js

const { Department, User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Create a new Department
 * @route   POST /api/departments/create
 * @access  Admin, SuperAdmin
 */
const createDepartment = async (req, res) => {
  try {
    const { name, supervisorId } = req.body;
    const companyId = req.user.companyId;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Department name is required.' });
    }

    // Check if department with the same name already exists within the company
    const existingDepartment = await Department.findOne({ where: { name, companyId } });
    if (existingDepartment) {
      return res.status(409).json({ message: 'Department with this name already exists in your company.' });
    }

    // If supervisorId is provided, validate the supervisor
    let supervisor = null;
    if (supervisorId) {
      supervisor = await User.findOne({
        where: {
          id: supervisorId,
          companyId,
          role: 'supervisor',
        },
      });

      if (!supervisor) {
        return res.status(400).json({ message: 'Invalid supervisorId. Supervisor must be a user with role "supervisor" in your company.' });
      }
    }

    // Create the Department
    const department = await Department.create({
      name,
      companyId,
      supervisorId: supervisor ? supervisor.id : null,
    });

    res.status(201).json({ message: 'Department created successfully.', department });
  } catch (error) {
    console.error('Error in createDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Get All Departments
 * @route   GET /api/departments/all
 * @access  Admin, SuperAdmin
 */
const getAllDepartments = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const departments = await Department.findAll({
      where: { companyId },
      include: [
        {
          model: User,
          as: 'Supervisor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'Users',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    res.status(200).json({ departments });
  } catch (error) {
    console.error('Error in getAllDepartments:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Get Department by ID
 * @route   GET /api/departments/:id
 * @access  Admin, SuperAdmin
 */
const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid Department ID.' });
    }

    const department = await Department.findOne({
      where: { id, companyId },
      include: [
        {
          model: User,
          as: 'Supervisor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
        {
          model: User,
          as: 'Users',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    res.status(200).json({ department });
  } catch (error) {
    console.error('Error in getDepartmentById:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Update Department
 * @route   PUT /api/departments/update/:id
 * @access  Admin, SuperAdmin
 */
const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, supervisorId } = req.body;
    const companyId = req.user.companyId;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid Department ID.' });
    }

    const department = await Department.findOne({ where: { id, companyId } });

    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // If supervisorId is provided, validate the supervisor
    if (supervisorId !== undefined) {
      if (supervisorId !== null) {
        const supervisor = await User.findOne({
          where: {
            id: supervisorId,
            companyId,
            role: 'supervisor',
          },
        });

        if (!supervisor) {
          return res.status(400).json({ message: 'Invalid supervisorId. Supervisor must be a user with role "supervisor" in your company.' });
        }

        department.supervisorId = supervisorId;
      } else {
        // Allow setting supervisorId to null
        department.supervisorId = null;
      }
    }

    // Update department name if provided
    if (name) {
      // Check for duplicate department name within the company
      const existingDepartment = await Department.findOne({
        where: {
          name,
          companyId,
          id: { [Op.ne]: id },
        },
      });

      if (existingDepartment) {
        return res.status(409).json({ message: 'Another department with this name already exists in your company.' });
      }

      department.name = name;
    }

    await department.save();

    res.status(200).json({ message: 'Department updated successfully.', department });
  } catch (error) {
    console.error('Error in updateDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * @desc    Delete Department
 * @route   DELETE /api/departments/delete/:id
 * @access  Admin, SuperAdmin
 */
const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;

    // Validate ID
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'Invalid Department ID.' });
    }

    const department = await Department.findOne({ where: { id, companyId } });

    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Check if the department has users assigned
    const usersCount = await User.count({ where: { departmentId: id } });
    if (usersCount > 0) {
      return res.status(400).json({ message: 'Cannot delete department with assigned users. Reassign or remove users first.' });
    }

    await department.destroy();

    res.status(200).json({ message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Error in deleteDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Assign Users to Department
 * @route   PUT /api/departments/:id/assign-users
 * @access  Admin, SuperAdmin, Supervisor
 */
const assignUsersToDepartment = async (req, res) => {
  const { id } = req.params; // Department ID
  const { userIds } = req.body;
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    const department = await Department.findOne({ where: { id, companyId } });
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // If the user is a supervisor, ensure they are managing this department
    if (userRole === 'supervisor') {
      if (department.supervisorId !== userId) {
        return res.status(403).json({ message: 'You are not the supervisor of this department.' });
      }
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Provide a non-empty array of userIds to assign.' });
    }

    // Fetch users to assign
    const usersToAssign = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
        companyId,
        role: {
          [Op.ne]: 'superAdmin', // Prevent assigning superAdmins
        },
      },
      attributes: ['id'],
    });

    // Check if all provided userIds exist within the company
    const foundUserIds = usersToAssign.map(user => user.id);
    const notFoundUserIds = userIds.filter(id => !foundUserIds.includes(id));

    if (notFoundUserIds.length > 0) {
      return res.status(400).json({ message: `Users with IDs ${notFoundUserIds.join(', ')} not found in your company or have restricted roles.` });
    }

    // Update Users' departmentId
    await User.update(
      { departmentId: id },
      {
        where: {
          id: {
            [Op.in]: foundUserIds,
          },
          companyId,
        },
      }
    );

    res.status(200).json({ message: 'Users assigned to department successfully.', assignedUserIds: foundUserIds });
  } catch (error) {
    console.error('Error in assignUsersToDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Remove Users from Department
 * @route   PUT /api/departments/:id/remove-users
 * @access  Admin, SuperAdmin, Supervisor
 */
const removeUsersFromDepartment = async (req, res) => {
  const { id } = req.params; // Department ID
  const { userIds } = req.body;
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    const department = await Department.findOne({ where: { id, companyId } });
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // If the user is a supervisor, ensure they are managing this department
    if (userRole === 'supervisor') {
      if (department.supervisorId !== userId) {
        return res.status(403).json({ message: 'You are not the supervisor of this department.' });
      }
    }

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Provide a non-empty array of userIds to remove.' });
    }

    // Fetch users to remove
    const usersToRemove = await User.findAll({
      where: {
        id: {
          [Op.in]: userIds,
        },
        departmentId: id,
        companyId,
      },
      attributes: ['id'],
    });

    const foundUserIds = usersToRemove.map(user => user.id);
    const notFoundUserIds = userIds.filter(id => !foundUserIds.includes(id));

    if (notFoundUserIds.length > 0) {
      return res.status(400).json({ message: `Users with IDs ${notFoundUserIds.join(', ')} are not assigned to this department.` });
    }

    // Update Users' departmentId to null
    await User.update(
      { departmentId: null },
      {
        where: {
          id: {
            [Op.in]: foundUserIds,
          },
          companyId,
        },
      }
    );

    res.status(200).json({ message: 'Users removed from department successfully.', removedUserIds: foundUserIds });
  } catch (error) {
    console.error('Error in removeUsersFromDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Users in Department
 * @route   GET /api/departments/:id/users
 * @access  Admin, SuperAdmin, Supervisor
 */
const getUsersInDepartment = async (req, res) => {
  const { id } = req.params; // Department ID
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const userId = req.user.id;

  try {
    const department = await Department.findOne({ where: { id, companyId } });
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // If the user is a supervisor, ensure they are managing this department
    if (userRole === 'supervisor') {
      if (department.supervisorId !== userId) {
        return res.status(403).json({ message: 'You are not the supervisor of this department.' });
      }
    }

    const users = await User.findAll({
      where: {
        departmentId: id,
        companyId,
      },
      attributes: { exclude: ['password'] },
      order: [['id', 'ASC']],
    });

    res.status(200).json({ message: 'Users retrieved successfully.', users });
  } catch (error) {
    console.error('Error in getUsersInDepartment:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  assignUsersToDepartment,
  removeUsersFromDepartment,
  getUsersInDepartment,
};
