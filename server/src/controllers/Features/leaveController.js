// File: src/controllers/Features/leaveController.js
const { prisma } = require("@config/database");

/**
 * POST /api/features/leaves
 * Description: Submits a new leave request.
 */
const submitLeaveRequest = async (req, res) => {
  try {
    const { type, reason, fromDate, toDate, approverId } = req.body;
    if (!type || !fromDate || !toDate || !approverId) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const approver = await prisma.users.findFirst({
      where: {
        id: Number(approverId),
        companyId: req.user.companyId,
        role: { in: ["admin", "supervisor", "superadmin"] },
      },
    });
    if (!approver) {
      return res.status(400).json({ message: "Invalid approver selected." });
    }
    if (Number(approverId) === req.user.id) {
      return res.status(400).json({ message: "Cannot set yourself as approver." });
    }
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: "From Date cannot be after To Date." });
    }
    const leave = await prisma.leaves.create({
      data: {
        userId: req.user.id,
        approverId: approver.id,
        type,
        reason: reason || null,
        fromDate: new Date(fromDate).toISOString(),
        toDate: new Date(toDate).toISOString(),
        companyId: req.user.companyId,
      },
    });
    return res.status(201).json({ message: "Leave request submitted successfully.", data: leave });
  } catch (error) {
    console.error("Error in submitLeaveRequest:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/leaves/user
 * Description: Retrieves all leave requests for the authenticated user.
 */
const getUserLeaves = async (req, res) => {
  try {
    const leaves = await prisma.leaves.findMany({
      where: { userId: req.user.id },
      include: {
        approver: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        company: { select: { id: true, name: true } },
      },
      orderBy: { fromDate: "desc" },
    });
    const formattedLeaves = leaves.map((leave) => ({
      ...leave,
      approver: {
        ...leave.approver,
        name: `${leave.approver.firstName} ${leave.approver.lastName}`.trim(),
      },
    }));
    return res.status(200).json({ message: "User leaves retrieved successfully.", data: formattedLeaves });
  } catch (error) {
    console.error("Error in getUserLeaves:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/leaves/pending
 * Description: Retrieves pending leave requests for the authenticated approver.
 */
const getPendingLeavesForApprover = async (req, res) => {
  try {
    const leaves = await prisma.leaves.findMany({
      where: { approverId: req.user.id, status: "Pending" },
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const formattedLeaves = leaves.map((leave) => ({
      ...leave,
      requester: {
        ...leave.requester,
        name: `${leave.requester.firstName} ${leave.requester.lastName}`.trim(),
      },
    }));
    return res.status(200).json({ message: "Pending leaves retrieved successfully.", data: formattedLeaves });
  } catch (error) {
    console.error("Error in getPendingLeavesForApprover:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/features/leaves/:id/approve
 * Description: Approves a leave request.
 */
const approveLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const leave = await prisma.leaves.findFirst({
      where: { id: leaveId, approverId: req.user.id, status: "Pending" },
    });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found or already processed." });
    }
    const updatedLeave = await prisma.leaves.update({
      where: { id: leaveId },
      data: { status: "Approved" },
    });
    return res.status(200).json({ message: "Leave approved successfully.", data: updatedLeave });
  } catch (error) {
    console.error("Error in approveLeave:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * PUT /api/features/leaves/:id/reject
 * Description: Rejects a leave request.
 */
const rejectLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: "Rejection reason is required." });
    }
    const leave = await prisma.leaves.findFirst({
      where: { id: leaveId, approverId: req.user.id, status: "Pending" },
    });
    if (!leave) {
      return res.status(404).json({ message: "Leave request not found or already processed." });
    }
    const updatedLeave = await prisma.leaves.update({
      where: { id: leaveId },
      data: { status: "Rejected", rejectionReason },
    });
    return res.status(200).json({ message: "Leave rejected successfully.", data: updatedLeave });
  } catch (error) {
    console.error("Error in rejectLeave:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/leaves/approvers
 * Description: Retrieves approvers for the authenticated user's company.
 */
const getApprovers = async (req, res) => {
  try {
    const approvers = await prisma.users.findMany({
      where: {
        companyId: req.user.companyId,
        role: { in: ["admin", "supervisor", "superadmin"] },
        NOT: { id: req.user.id },
      },
      select: { id: true, firstName: true, lastName: true, email: true, role: true },
    });
    return res.status(200).json({ message: "Approvers retrieved successfully.", data: approvers });
  } catch (error) {
    console.error("Error in getApprovers:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

/**
 * GET /api/features/leaves/approver
 * Description: Retrieves leave requests for the approver with an optional status filter.
 */
const getLeavesForApprover = async (req, res) => {
  try {
    const { status } = req.query;
    if (status && !["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status filter." });
    }
    const query = { approverId: req.user.id };
    if (status) query.status = status;
    const leaves = await prisma.leaves.findMany({
      where: query,
      include: {
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
        },
        company: { select: { id: true, name: true } },
      },
      orderBy: { fromDate: "desc" },
    });
    const formattedLeaves = leaves.map((leave) => ({
      ...leave,
      requester: {
        ...leave.requester,
        name: `${leave.requester.firstName} ${leave.requester.lastName}`.trim(),
      },
    }));
    return res.status(200).json({ message: "Leaves retrieved successfully.", data: formattedLeaves });
  } catch (error) {
    console.error("Error in getLeavesForApprover:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  submitLeaveRequest,
  getUserLeaves,
  getPendingLeavesForApprover,
  approveLeave,
  rejectLeave,
  getApprovers,
  getLeavesForApprover,
};
