// File: server/controllers/companiesController.js
const { prisma } = require("../config/database");

// Get all companies.
const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.companies.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        country: true,
        currency: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ message: "Companies retrieved successfully.", data: companies });
  } catch (error) {
    console.error("Get All Companies Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get a company by its ID.
const getCompanyById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Company ID." });
    const company = await prisma.companies.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        country: true,
        currency: true,
        language: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!company) return res.status(404).json({ message: "Company not found." });
    return res.status(200).json({ message: "Company retrieved successfully.", data: company });
  } catch (error) {
    console.error("Error in getCompanyById:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Create a new company.
const createCompany = async (req, res) => {
  const { name, domain, country, currency, language } = req.body;
  if (!name || !domain || !country || !currency || !language)
    return res.status(400).json({
      message: "Name, domain, country, currency, and language are required.",
    });
  try {
    const existingCompany = await prisma.companies.findUnique({
      where: { domain },
    });
    if (existingCompany) return res.status(400).json({ message: "Company with this domain already exists." });
    const newCompany = await prisma.companies.create({
      data: { name, domain, country, currency, language },
    });
    return res.status(201).json({ message: "Company created successfully.", data: newCompany });
  } catch (error) {
    console.error("Create Company Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update an existing company.
const updateCompany = async (req, res) => {
  const id = Number(req.params.id);
  const { name, domain, country, currency, language } = req.body;
  if (!name && !domain && !country && !currency && !language) return res.status(400).json({ message: "At least one field must be provided for update." });
  try {
    const company = await prisma.companies.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ message: "Company not found." });
    if (domain && domain !== company.domain) {
      const existingCompany = await prisma.companies.findUnique({
        where: { domain },
      });
      if (existingCompany) return res.status(400).json({ message: "Company with this domain already exists." });
    }
    const updatedCompany = await prisma.companies.update({
      where: { id },
      data: {
        name: name || company.name,
        domain: domain || company.domain,
        country: country || company.country,
        currency: currency || company.currency,
        language: language || company.language,
      },
    });
    return res.status(200).json({ message: "Company updated successfully.", data: updatedCompany });
  } catch (error) {
    console.error("Update Company Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a company.
const deleteCompany = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const company = await prisma.companies.findUnique({ where: { id } });
    if (!company) return res.status(404).json({ message: "Company not found." });
    await prisma.companies.delete({ where: { id } });
    return res.status(200).json({ message: "Company deleted successfully." });
  } catch (error) {
    console.error("Delete Company Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get the user count for a company.
const getCompanyUserCount = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Company ID." });
    const userCount = await prisma.users.count({ where: { companyId: id } });
    return res.status(200).json({
      message: "Company user count retrieved successfully.",
      data: { companyId: id, userCount },
    });
  } catch (error) {
    console.error("Error in getCompanyUserCount:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUserCount,
};
