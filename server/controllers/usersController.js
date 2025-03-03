// File: server/controllers/usersController.js
const bcrypt = require("bcryptjs");
const { prisma } = require("../config/database");

// Get all users in the same company (excluding the current user).
const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ message: "No company associated with the user." });
    const users = await prisma.users.findMany({
      where: { companyId, NOT: { id: req.user.id } },
      select: {
        id: true,
        email: true,
        firstName: true,
        middleName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ message: "Users retrieved successfully.", data: users });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Create a new user.
const createUser = async (req, res) => {
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;
  if (!email || !password || !firstName || !lastName)
    return res.status(400).json({
      message: "Email, password, firstName, and lastName are required.",
    });
  try {
    const existingUser = await prisma.users.findFirst({
      where: { email, companyId: req.user.companyId },
    });
    if (existingUser)
      return res.status(409).json({
        message: "User already exists with this email in your company.",
      });
    const hashedPassword = bcrypt.hashSync(password, 10);
    let targetCompanyId = req.user.companyId;
    if (req.user.role === "superadmin" && companyId) {
      const companyExists = await prisma.companies.findUnique({
        where: { id: Number(companyId) },
      });
      if (!companyExists) return res.status(400).json({ message: "Invalid companyId provided." });
      targetCompanyId = Number(companyId);
    }
    const newUser = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        role: role || "user",
        firstName,
        middleName,
        lastName,
        phone,
        status: status !== undefined ? status : true,
        companyId: targetCompanyId,
        lastActiveAt: new Date(),
        presenceStatus: "active",
      },
    });
    const { password: pwd, ...userWithoutPassword } = newUser;
    return res.status(201).json({
      message: "User created successfully.",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in createUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update an existing user.
const updateUser = async (req, res) => {
  const id = Number(req.params.id);
  const { email, password, role, firstName, middleName, lastName, phone, status, companyId } = req.body;
  try {
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) return res.status(400).json({ message: "No company associated with the user." });
    const user = await prisma.users.findFirst({
      where: { id, companyId: requesterCompanyId },
    });
    if (!user)
      return res.status(404).json({
        message: "User not found or does not belong to your company.",
      });
    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (middleName !== undefined) data.middleName = middleName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined && email !== user.email) {
      const emailExists = await prisma.users.findFirst({ where: { email } });
      if (emailExists && emailExists.id !== user.id)
        return res.status(409).json({ message: "Another user already has this email." });
      data.email = email;
    }
    if (phone !== undefined) data.phone = phone;
    if (status !== undefined) data.status = status;
    if (password) data.password = bcrypt.hashSync(password, 10);
    if (companyId !== undefined) {
      const companyExists = await prisma.companies.findUnique({
        where: { id: Number(companyId) },
      });
      if (!companyExists) return res.status(400).json({ message: "Invalid companyId provided." });
      data.companyId = Number(companyId);
    }
    if (role) data.role = role;
    const updatedUser = await prisma.users.update({ where: { id }, data });
    const { password: pwd, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: "User updated successfully.",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Delete a user.
const deleteUser = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const requesterCompanyId = req.user.companyId;
    if (!requesterCompanyId) return res.status(400).json({ message: "No company associated with the user." });
    const user = await prisma.users.findFirst({
      where: { id, companyId: requesterCompanyId },
    });
    if (!user)
      return res.status(404).json({
        message: "User not found or does not belong to your company.",
      });
    if (user.id === req.user.id) return res.status(400).json({ message: "You cannot delete your own account." });
    await prisma.users.delete({ where: { id } });
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update the user's presence status.
const updateUserPresence = async (req, res) => {
  const { presenceStatus } = req.body;
  const allowedStatuses = ["active", "away", "offline"];
  if (!allowedStatuses.includes(presenceStatus)) return res.status(400).json({ message: "Invalid presence status." });
  try {
    const data = { presenceStatus };
    if (presenceStatus === "active" || presenceStatus === "away") data.lastActiveAt = new Date();
    else if (presenceStatus === "offline") data.lastActiveAt = null;
    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data,
    });
    const { password: pwd, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: "Presence status updated successfully.",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error in updateUserPresence:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Change the user's password.
const changeUserPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword)
      return res.status(400).json({ message: "All password fields are required." });
    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: "New password and confirm password do not match." });
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found." });
    const isMatch = bcrypt.compareSync(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect." });
    await prisma.users.update({
      where: { id: req.user.id },
      data: { password: bcrypt.hashSync(newPassword, 10) },
    });
    return res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Get a user by ID.
const getUserById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        companyId: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (req.user.role !== "superadmin" && user.companyId !== req.user.companyId)
      return res.status(403).json({ message: "Unauthorized request." });
    return res.status(200).json({ data: user });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserPresence,
  changeUserPassword,
  getUserById,
};
