const { PrismaClient } = require("@prisma/client");
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
