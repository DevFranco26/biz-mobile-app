// src/models/index.js

import User from './Users.js';
import Company from './Company.js';
import Location from './Location.js';
import TimeLogs from './TimeLogs.js';
import UserSettings from './UserSettings.js';
import Leave from './Leave.js';
import ShiftSchedule from './ShiftSchedule.js';
import UserShiftAssignment from './UserShiftAssignment.js';
import PayrollRecords from './PayrollRecords.js';
import PayRates from './PayRates.js';
import PayrollSettings from './PayrollSettings.js';

// User <-> Company
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

// User <-> Location
User.hasMany(Location, { foreignKey: 'adminId', as: 'locations' });
Location.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
Location.belongsTo(User, { foreignKey: 'updatedBy', as: 'lastEditor' });

// User <-> TimeLogs
User.hasMany(TimeLogs, { foreignKey: 'userId', as: 'timeLogs' });
TimeLogs.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserSettings <-> User and Location
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserSettings, { foreignKey: 'userId', as: 'settings' });

UserSettings.belongsTo(Location, { foreignKey: 'locationId', as: 'location' });
Location.hasMany(UserSettings, { foreignKey: 'locationId', as: 'userSettings' });

// User <-> Leave (Requester)
User.hasMany(Leave, { foreignKey: 'userId', as: 'leaveRequests' });
Leave.belongsTo(User, { foreignKey: 'userId', as: 'requester' });

// User <-> Leave (Approver)
User.hasMany(Leave, { foreignKey: 'approverId', as: 'approvals' });
Leave.belongsTo(User, { foreignKey: 'approverId', as: 'approver' });

// Company <-> Leave
Company.hasMany(Leave, { foreignKey: 'companyId', as: 'leaves' });
Leave.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Company <-> ShiftSchedule
Company.hasMany(ShiftSchedule, { foreignKey: 'companyId', as: 'shiftSchedules' });
ShiftSchedule.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User <-> ShiftSchedule
User.belongsToMany(ShiftSchedule, { through: UserShiftAssignment, foreignKey: 'userId', otherKey: 'shiftScheduleId', as: 'assignedShifts' });
ShiftSchedule.belongsToMany(User, { through: UserShiftAssignment, foreignKey: 'shiftScheduleId', otherKey: 'userId', as: 'assignedUsers' });

UserShiftAssignment.belongsTo(ShiftSchedule, { foreignKey: 'shiftScheduleId', as: 'shiftSchedule' });
UserShiftAssignment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company <-> PayrollSettings
Company.hasOne(PayrollSettings, { foreignKey: 'companyId', as: 'payrollSettings' });
PayrollSettings.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// User <-> PayRates
User.hasOne(PayRates, { foreignKey: 'userId', as: 'payRates' });
PayRates.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> PayrollRecords
User.hasMany(PayrollRecords, { foreignKey: 'userId', as: 'payrollRecords' });
PayrollRecords.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Company <-> PayrollRecords
Company.hasMany(PayrollRecords, { foreignKey: 'companyId', as: 'companyPayrollRecords' });
PayrollRecords.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

export {
  User,
  Company,
  Location,
  TimeLogs,
  UserSettings,
  Leave,
  ShiftSchedule,
  UserShiftAssignment,
  PayrollRecords,
  PayrollSettings,
  PayRates
};

