// File: server/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");

// Authenticate user and return JWT.
const signIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        password: true,
        lastActiveAt: true,
        presenceStatus: true,
      },
    });
    if (!user) return res.status(400).json({ message: "User not found." });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });
    if (!process.env.JWT_SECRET) return res.status(500).json({ message: "JWT_SECRET is not defined." });
    await prisma.users.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date(), presenceStatus: "active" },
    });
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        companyId: user.companyId,
        departmentId: user.departmentId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10y" }
    );
    const { password: pwd, ...userWithoutPassword } = user;
    return res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Error in signIn:", err);
    return res.status(500).json({ message: "Server error." });
  }
};

// Return sign-out success.
const signOut = (req, res) => {
  return res.status(200).json({ message: "Signed out successfully." });
};

// Retrieve the current authenticated user.
const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        companyId: true,
        departmentId: true,
        firstName: true,
        lastName: true,
        middleName: true,
        phone: true,
        presenceStatus: true,
        lastActiveAt: true,
      },
    });
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ message: "User retrieved successfully.", user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Update details of the current authenticated user.
const updateCurrentUser = async (req, res) => {
  const { firstName, middleName, lastName, phone } = req.body;
  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: "User not found." });
    const data = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (middleName !== undefined) data.middleName = middleName;
    if (lastName !== undefined) data.lastName = lastName;
    if (phone !== undefined) data.phone = phone;
    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data,
    });
    const { password: pwd, ...userWithoutPassword } = updatedUser;
    return res.status(200).json({
      message: "User updated successfully.",
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Error updating current user:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = { signIn, signOut, getCurrentUser, updateCurrentUser };
