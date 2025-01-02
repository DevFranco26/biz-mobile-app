// File: server/controllers/leavesController.js

const Leave = require('../models/Leave.js');
const User = require('../models/Users.js');
const Company = require('../models/Company.js');
const { Op } = require('sequelize');

/**
 * Submit a Leave Request
 * Allows a user to submit a leave request.
 */
const submitLeaveRequest = async (req, res) => {
  const { type, reason, fromDate, toDate, approverId } = req.body;

  // Validate required fields
  if (!type || !fromDate || !toDate || !approverId) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Verify approver exists and is within the same company and has a valid role
    const approver = await User.findOne({
      where: {
        id: approverId,
        companyId: req.user.companyId,
        role: { [Op.in]: ['admin', 'supervisor'] },
      },
    });

    if (!approver) {
      return res.status(400).json({ message: 'Invalid approver selected.' });
    }

    // Prevent user from setting themselves as approver
    if (approver.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot set yourself as approver.' });
    }

    // Ensure fromDate <= toDate
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: 'From Date cannot be after To Date.' });
    }

    // Convert the dates to UTC before saving
    const fromDateUTC = new Date(fromDate).toISOString(); // Convert to UTC
    const toDateUTC = new Date(toDate).toISOString(); // Convert to UTC

    // Create the leave request
    const leave = await Leave.create({
      userId: req.user.id,
      approverId: approver.id,
      type,
      reason: reason || null,
      fromDate: fromDateUTC,
      toDate: toDateUTC,
      companyId: req.user.companyId,
    });

    return res.status(201).json({ message: 'Leave request submitted successfully.', data: leave });
  } catch (error) {
    console.error('Error submitting leave request:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Leave Requests of the Logged-In User
 * Retrieves all leave requests submitted by the authenticated user.
 */
const getUserLeaves = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: { userId: req.user.id },
      include: [
        { 
          model: User, 
          as: 'approver', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'] // Updated attributes
        },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
      order: [['fromDate', 'DESC']],
    });

    // Map through the leaves to construct full approver names
    const formattedLeaves = leaves.map(leave => ({
      ...leave.toJSON(),
      approver: {
        ...leave.approver,
        // Combine firstName and lastName if you want a full name in the response
        name: `${leave.approver.firstName} ${leave.approver.lastName}`.trim(),
      },
    }));

    return res.status(200).json({ data: formattedLeaves });
  } catch (error) {
    console.error('Error fetching user leaves:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Pending Leave Requests for Approver
 * Retrieves all pending leave requests assigned to the authenticated approver.
 */
const getPendingLeavesForApprover = async (req, res) => {
  try {
    const leaves = await Leave.findAll({
      where: {
        approverId: req.user.id,
        status: 'Pending',
      },
      include: [
        { 
          model: User, 
          as: 'requester', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'] 
        },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Optionally, you can combine firstName and lastName here if needed
    const formattedLeaves = leaves.map(leave => ({
      ...leave.toJSON(),
      requester: {
        ...leave.requester,
        // Combine firstName and lastName if you want a full name in the response
        // name: `${leave.requester.firstName} ${leave.requester.lastName}`.trim()
      },
    }));

    return res.status(200).json({ data: formattedLeaves });
  } catch (error) {
    console.error('Error fetching pending leaves:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Approve a Leave Request
 * Updates the status of a leave request to 'Approved'.
 */
const approveLeave = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the leave request with the specified ID, approver ID, and status 'Pending'
    const leave = await Leave.findOne({
      where: {
        id,
        approverId: req.user.id,
        status: 'Pending',
      },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found or already processed.' });
    }

    // Update only the 'status' field to 'Approved'
    await leave.update({ status: 'Approved' }, { fields: ['status'] });

    // Optionally, reload the leave instance to get the latest data
    await leave.reload();

    return res.status(200).json({ message: 'Leave request approved successfully.', data: leave });
  } catch (error) {
    console.error('Error approving leave:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Reject a Leave Request
 * Updates the status of a leave request to 'Rejected' with a rejection reason.
 */
const rejectLeave = async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  // Validate that a rejection reason is provided
  if (!rejectionReason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  try {
    // Find the leave request with the specified ID, approver ID, and status 'Pending'
    const leave = await Leave.findOne({
      where: {
        id,
        approverId: req.user.id,
        status: 'Pending',
      },
    });

    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found or already processed.' });
    }

    // Update only the 'status' and 'rejectionReason' fields
    await leave.update(
      { status: 'Rejected', rejectionReason },
      { fields: ['status', 'rejectionReason'] }
    );

    // Optionally, reload the leave instance to get the latest data
    await leave.reload();

    return res.status(200).json({ message: 'Leave request rejected successfully.', data: leave });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Get Approvers within the Same Company
 * Retrieves all users with roles 'admin' or 'supervisor' within the same company, excluding the requester.
 */
const getApprovers = async (req, res) => {
  try {
    const approvers = await User.findAll({
      where: {
        companyId: req.user.companyId,
        role: { [Op.in]: ['admin', 'supervisor'] },
        id: { [Op.ne]: req.user.id }, // Exclude current user
      },
      attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
    });

    const approverList = approvers.map(approver => ({
      id: approver.id,
      firstName: approver.firstName,
      lastName: approver.lastName,
      email: approver.email,
      role: approver.role,
    }));

    return res.status(200).json({ data: approverList });
  } catch (error) {
    console.error('Error fetching approvers:', error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * Fetch Leaves for Approver based on Status
 * Retrieves leave requests based on the provided status filter.
 */
const getLeavesForApprover = async (req, res) => {
  const { status } = req.query;

  // Validate status if provided
  if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status filter.' });
  }

  const query = {
    approverId: req.user.id,
  };

  if (status) {
    query.status = status;
  }

  try {
    const leaves = await Leave.findAll({
      where: query,
      include: [
        { 
          model: User, 
          as: 'requester', 
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'] 
        },
        { model: Company, as: 'company', attributes: ['id', 'name'] },
      ],
      order: [['fromDate', 'DESC']],
    });

    const formattedLeaves = leaves.map(leave => ({
      ...leave.toJSON(),
      requester: {
        ...leave.requester,
        name: `${leave.requester.firstName} ${leave.requester.lastName}`.trim(),
      },
    }));

    return res.status(200).json({ data: formattedLeaves });
  } catch (error) {
    console.error('Error fetching leaves for approver:', error);
    return res.status(500).json({ message: 'Internal server error.' });
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
