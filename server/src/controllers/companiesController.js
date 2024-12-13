// src/controllers/companiesController.js

import Company from '../models/Company.js';

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'name', 'domain', 'createdAt', 'updatedAt'],
      order: [['id', 'ASC']],
    });
    res.status(200).json({ message: 'Companies retrieved successfully.', data: companies });
  } catch (error) {
    console.error('Get All Companies Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Create a new company
export const createCompany = async (req, res) => {
  const { name, domain } = req.body;
  try {
    const existingCompany = await Company.findOne({ where: { domain } });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company with this domain already exists.' });
    }

    const newCompany = await Company.create({ name, domain });
    res.status(201).json({ message: 'Company created successfully.', data: newCompany });
  } catch (error) {
    console.error('Create Company Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Update a company
export const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, domain } = req.body;
  try {
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    // Check if the new domain is unique
    if (domain && domain !== company.domain) {
      const existingCompany = await Company.findOne({ where: { domain } });
      if (existingCompany) {
        return res.status(400).json({ message: 'Company with this domain already exists.' });
      }
    }

    await company.update({ name: name || company.name, domain: domain || company.domain });
    res.status(200).json({ message: 'Company updated successfully.', data: company });
  } catch (error) {
    console.error('Update Company Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Delete a company
export const deleteCompany = async (req, res) => {
  const { id } = req.params;
  try {
    const company = await Company.findByPk(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    await company.destroy();
    res.status(200).json({ message: 'Company deleted successfully.' });
  } catch (error) {
    console.error('Delete Company Error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
