// File: server/controllers/departmentController.js
const { prisma } = require("../config/database");

const createDepartment = async (req, res) => {
  try {
    const { name, supervisorId } = req.body;
    const companyId = req.user.companyId;
    if (!name) return res.status(400).json({ message: "Department name is required." });
    const existingDepartment = await prisma.departments.findFirst({
      where: { name, companyId },
    });
    if (existingDepartment)
      return res.status(409).json({
        message: "Department with this name already exists in your company.",
      });
    let supervisor = null;
    if (supervisorId) {
      supervisor = await prisma.users.findFirst({
        where: { id: Number(supervisorId), companyId, role: "supervisor" },
      });
      if (!supervisor) return res.status(400).json({ message: "Invalid supervisorId." });
    }
    const department = await prisma.departments.create({
      data: {
        name,
        companyId,
        supervisorId: supervisor ? supervisor.id : null,
      },
    });
    console.log("Created department:", department);
    return res.status(201).json({ message: "Department created successfully.", department });
  } catch (error) {
    console.error("Error in createDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getAllDepartments = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const departments = await prisma.departments.findMany({
      where: { companyId },
      include: {
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        Users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    return res.status(200).json({ departments });
  } catch (error) {
    console.error("Error in getAllDepartments:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const companyId = req.user.companyId;
    if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Department ID." });
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
      include: {
        supervisor: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        Users: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!department) return res.status(404).json({ message: "Department not found." });
    return res.status(200).json({ department });
  } catch (error) {
    console.error("Error in getDepartmentById:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, supervisorId } = req.body;
    const companyId = req.user.companyId;
    if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Department ID." });
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    if (!department) return res.status(404).json({ message: "Department not found." });
    if (supervisorId !== undefined && supervisorId !== null) {
      const supervisor = await prisma.users.findFirst({
        where: { id: Number(supervisorId), companyId, role: "supervisor" },
      });
      if (!supervisor) return res.status(400).json({ message: "Invalid supervisorId." });
    }
    if (name) {
      const duplicate = await prisma.departments.findFirst({
        where: { name, companyId, NOT: { id } },
      });
      if (duplicate)
        return res.status(409).json({
          message: "Another department with this name already exists.",
        });
    }
    const updatedDepartment = await prisma.departments.update({
      where: { id },
      data: {
        name: name || department.name,
        supervisorId: supervisorId !== undefined ? supervisorId : department.supervisorId,
      },
    });
    return res.status(200).json({
      message: "Department updated successfully.",
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("Error in updateDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const companyId = req.user.companyId;
    if (!id || isNaN(id)) return res.status(400).json({ message: "Invalid Department ID." });
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    if (!department) return res.status(404).json({ message: "Department not found." });
    console.log("Deleting department:", department);
    await prisma.departments.delete({ where: { id } });
    return res.status(200).json({ message: "Department deleted successfully." });
  } catch (error) {
    console.error("Error in deleteDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const assignUsersToDepartment = async (req, res) => {
  const id = Number(req.params.id);
  const { userIds } = req.body;
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const requesterId = req.user.id;
  try {
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    console.log("Department before assignment:", department);
    if (!department) return res.status(404).json({ message: "Department not found." });
    if (userRole === "supervisor" && department.supervisorId !== requesterId)
      return res.status(403).json({ message: "You are not the supervisor of this department." });
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ message: "Provide a non-empty array of userIds to assign." });
    const usersToAssign = await prisma.users.findMany({
      where: { id: { in: userIds }, companyId, role: { not: "superadmin" } },
      select: { id: true, role: true },
    });
    console.log("Users to assign:", usersToAssign);
    const foundUserIds = usersToAssign.map((u) => u.id);
    const notFoundUserIds = userIds.filter((uid) => !foundUserIds.includes(uid));
    if (notFoundUserIds.length > 0)
      return res.status(400).json({
        message: `Users with IDs ${notFoundUserIds.join(", ")} not found.`,
      });
    await prisma.users.updateMany({
      where: { id: { in: foundUserIds }, companyId },
      data: { departmentId: id },
    });
    let updatedDepartment = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    console.log("Department after user assignment, before supervisor check:", updatedDepartment);
    // If supervisorId is still null, update it with the first assigned user's id regardless of role.
    if (!updatedDepartment.supervisorId && usersToAssign.length > 0) {
      updatedDepartment = await prisma.departments.update({
        where: { id },
        data: { supervisorId: usersToAssign[0].id },
      });
      console.log("Department after supervisor update:", updatedDepartment);
    }
    return res.status(200).json({
      message: "Users assigned successfully.",
      assignedUserIds: foundUserIds,
    });
  } catch (error) {
    console.error("Error in assignUsersToDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const removeUsersFromDepartment = async (req, res) => {
  const id = Number(req.params.id);
  const { userIds } = req.body;
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const requesterId = req.user.id;
  try {
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    if (!department) return res.status(404).json({ message: "Department not found." });
    if (userRole === "supervisor" && department.supervisorId !== requesterId)
      return res.status(403).json({ message: "You are not the supervisor of this department." });
    if (!Array.isArray(userIds) || userIds.length === 0) return res.status(400).json({ message: "Provide a non-empty array of userIds to remove." });
    const usersToRemove = await prisma.users.findMany({
      where: { id: { in: userIds }, departmentId: id, companyId },
      select: { id: true },
    });
    const foundUserIds = usersToRemove.map((u) => u.id);
    const notFoundUserIds = userIds.filter((uid) => !foundUserIds.includes(uid));
    if (notFoundUserIds.length > 0)
      return res.status(400).json({
        message: `Users with IDs ${notFoundUserIds.join(", ")} are not assigned.`,
      });
    await prisma.users.updateMany({
      where: { id: { in: foundUserIds }, companyId },
      data: { departmentId: null },
    });
    return res.status(200).json({
      message: "Users removed successfully.",
      removedUserIds: foundUserIds,
    });
  } catch (error) {
    console.error("Error in removeUsersFromDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const getUsersInDepartment = async (req, res) => {
  const id = Number(req.params.id);
  const companyId = req.user.companyId;
  const userRole = req.user.role;
  const requesterId = req.user.id;
  try {
    const department = await prisma.departments.findFirst({
      where: { id, companyId },
    });
    if (!department) return res.status(404).json({ message: "Department not found." });
    if (userRole === "supervisor" && department.supervisorId !== requesterId)
      return res.status(403).json({ message: "You are not the supervisor of this department." });
    const users = await prisma.users.findMany({
      where: { departmentId: id, companyId },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { id: "asc" },
    });
    return res.status(200).json({ message: "Users retrieved successfully.", users });
  } catch (error) {
    console.error("Error in getUsersInDepartment:", error);
    return res.status(500).json({ message: "Internal server error." });
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
