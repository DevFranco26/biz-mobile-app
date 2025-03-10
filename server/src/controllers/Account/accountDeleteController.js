const bcrypt = require("bcryptjs");
const { prisma } = require("@config/database");

/**
 * DELETE /api/account/delete
 * Deletes the current user account. If admin, deletes the associated company and related data.
 */
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role.toLowerCase();
    const companyId = req.user.companyId;
    if (userRole === "admin") {
      if (!companyId) {
        return res.status(400).json({ message: "No company associated with this user." });
      }
      await prisma.$transaction(async (tx) => {
        await tx.leave.deleteMany({ where: { companyId } });
        await tx.department.deleteMany({ where: { companyId } });
        await tx.shiftSchedule.deleteMany({ where: { companyId } });
        await tx.payrollRecord.deleteMany({ where: { companyId } });
        await tx.payrollSetting.deleteMany({ where: { companyId } });
        await tx.subscription.deleteMany({ where: { companyId } });
        await tx.payment.deleteMany({ where: { companyId } });
        await tx.user.deleteMany({ where: { companyId } });
        await tx.company.delete({ where: { id: companyId } });
      });
      return res.status(200).json({ message: "Company and all related data have been deleted successfully." });
    } else {
      await prisma.user.delete({ where: { id: userId } });
      return res.status(200).json({ message: "User account deleted successfully." });
    }
  } catch (error) {
    console.error("Error in deleteAccount:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * DELETE /api/account/delete-google
 * Deletes a user account for Google authentication.
 */
const deleteUserAccountForGoogle = async (req, res) => {
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
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: "Invalid password." });
    }
    if (user.role === "admin") {
      await prisma.company.delete({ where: { id: user.companyId } });
      return res.status(200).json({ message: "Admin account and associated company deleted successfully." });
    } else {
      await prisma.user.delete({ where: { id: user.id } });
      return res.status(200).json({ message: "User account deleted successfully." });
    }
  } catch (error) {
    console.error("Error in deleteUserAccountForGoogle:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  deleteAccount,
  deleteUserAccountForGoogle,
};
