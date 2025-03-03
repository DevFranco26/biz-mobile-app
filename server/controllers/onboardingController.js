// File: server/controllers/onboardingController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");
exports.checkCompanyName = async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: "Company name is required" });
  const normalizedName = name.trim().toLowerCase();
  try {
    const company = await prisma.companies.findFirst({ where: { name: { equals: normalizedName, mode: "insensitive" } } });
    return res.json({ exists: !!company });
  } catch (error) {
    console.error("Error checking company name:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.checkEmail = async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email is required" });
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const user = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    return res.json({ exists: !!user });
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.getStarted = async (req, res) => {
  try {
    const { firstName, middleName, lastName, email, password, phone, companyName, country, currency, language, subscriptionPlanId, paymentMethod } =
      req.body;
    if (!firstName || !lastName || !email || !password || !companyName || !country || !currency || !language || !subscriptionPlanId || !paymentMethod)
      return res.status(400).json({ message: "Missing required fields." });
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) return res.status(409).json({ message: "Email already exists." });
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUser = await prisma.users.create({
      data: { firstName, middleName, lastName, email: normalizedEmail, password: hashedPassword, phone, role: "admin" },
    });
    const newCompany = await prisma.companies.create({
      data: { name: companyName, domain: companyName.replace(/\s+/g, "").toLowerCase() + ".com", country, currency, language },
    });
    await prisma.users.update({ where: { id: newUser.id }, data: { companyId: newCompany.id } });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: "JWT_SECRET is not set." });
    const token = jwt.sign({ userId: newUser.id, role: newUser.role, companyId: newCompany.id }, process.env.JWT_SECRET, { expiresIn: "10y" });
    const plan = await prisma.subscriptionPlans.findUnique({ where: { id: Number(subscriptionPlanId) } });
    if (!plan) return res.status(400).json({ message: "Invalid subscription plan." });
    const now = new Date();
    const expiration = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await prisma.subscriptions.create({
      data: {
        companyId: newCompany.id,
        planId: plan.id,
        paymentMethod,
        paymentDateTime: now,
        expirationDateTime: expiration,
        renewalDateTime: expiration,
        status: "active",
      },
    });
    return res
      .status(201)
      .json({
        message: "Account, company, and subscription created successfully.",
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phone: newUser.phone,
          role: newUser.role,
          companyId: newUser.companyId,
        },
      });
  } catch (error) {
    console.error("getStarted Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
