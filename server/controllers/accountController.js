const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role.toLowerCase();
    const companyId = req.user.companyId;

    if (role === "admin") {
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user." });
      }

      await prisma.$transaction(async (tx) => {
        await tx.leaves.deleteMany({ where: { companyId } });
        await tx.departments.deleteMany({ where: { companyId } });
        await tx.shiftSchedules.deleteMany({ where: { companyId } });
        await tx.payrollRecords.deleteMany({ where: { companyId } });
        await tx.payrollSettings.deleteMany({ where: { companyId } });
        await tx.subscriptions.deleteMany({ where: { companyId } });
        await tx.payments.deleteMany({ where: { companyId } });
        await tx.users.deleteMany({ where: { companyId } });
        await tx.companies.delete({ where: { id: companyId } });
      });

      return res.status(200).json({ message: "Company and all related data have been deleted successfully." });
    } else {
      await prisma.users.delete({ where: { id: userId } });

      return res.status(200).json({ message: "User account deleted successfully." });
    }
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

exports.deleteUserAccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password." });
    }

    if (user.role === "admin") {
      await prisma.companies.delete({
        where: { id: user.companyId },
      });
      return res.status(200).json({ message: "Admin account and associated company deleted successfully." });
    } else {
      await prisma.users.delete({
        where: { id: user.id },
      });
      return res.status(200).json({ message: "User account deleted successfully." });
    }
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
