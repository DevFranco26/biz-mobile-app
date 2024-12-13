// src/controllers/departmentsController.js

import Department from '../models/Department.js';
import User from '../models/User.js';
import Company from '../models/Company.js';

// Create a new Department
export const createDepartment = async (req, res) => {
  const { name, companyId, supervisorId } = req.body;

  try {
    // Validate Company
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ message: 'Invalid Company ID.' });
    }

    // Validate Supervisor
    if (supervisorId) {
      const supervisor = await User.findByPk(supervisorId);
      if (!supervisor || supervisor.role !== 'supervisor') {
        return res.status(400).json({ message: 'Invalid Supervisor ID.' });
      }
    }

    // Create Department
    const department = await Department.create({
      name,
      companyId,
      supervisorId: supervisorId || null,
    });

    return res.status(201).json({ message: 'Department created successfully.', data: department });
  } catch (error) {
    console.error('Create Department Error:', error);
    return res.status(500).json({ message: 'An error occurred while creating the department.' });
  }
};

// Get All Departments (Filtered by Authenticated User's Company)
export const getAllDepartments = async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const departments = await Department.findAll({
      where: { companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'domain'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    return res.status(200).json({ message: 'Departments retrieved successfully.', data: departments });
  } catch (error) {
    console.error('Get All Departments Error:', error);
    return res.status(500).json({ message: 'An error occurred while fetching departments.' });
  }
};

// Get Department by ID
export const getDepartmentById = async (req, res) => {
  const { id } = req.params;

  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const department = await Department.findOne({
      where: { id, companyId },
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'domain'] },
        { model: User, as: 'supervisor', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'users', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    return res.status(200).json({ message: 'Department retrieved successfully.', data: department });
  } catch (error) {
    console.error('Get Department By ID Error:', error);
    return res.status(500).json({ message: 'An error occurred while fetching the department.' });
  }
};

// Update Department
export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, supervisorId } = req.body;

  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const department = await Department.findOne({ where: { id, companyId } });
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    // Validate Supervisor
    if (supervisorId) {
      const supervisor = await User.findByPk(supervisorId);
      if (!supervisor || supervisor.role !== 'supervisor') {
        return res.status(400).json({ message: 'Invalid Supervisor ID.' });
      }
    }

    // Update Department
    department.name = name || department.name;
    department.supervisorId = supervisorId !== undefined ? supervisorId : department.supervisorId;

    await department.save();

    return res.status(200).json({ message: 'Department updated successfully.', data: department });
  } catch (error) {
    console.error('Update Department Error:', error);
    return res.status(500).json({ message: 'An error occurred while updating the department.' });
  }
};

// Delete Department
export const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.status(400).json({ message: 'No company associated with the requesting user.' });
    }

    const department = await Department.findOne({ where: { id, companyId } });
    if (!department) {
      return res.status(404).json({ message: 'Department not found.' });
    }

    await department.destroy();

    return res.status(200).json({ message: 'Department deleted successfully.' });
  } catch (error) {
    console.error('Delete Department Error:', error);
    return res.status(500).json({ message: 'An error occurred while deleting the department.' });
  }
};
