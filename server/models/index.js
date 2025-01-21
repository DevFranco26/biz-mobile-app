// File: server/models/index.js

const User = require('./Users.js');
const Company = require('./Company.js');
const Location = require('./Location.js');
const TimeLogs = require('./TimeLogs.js');
const UserSettings = require('./UserSettings.js');
const Leave = require('./Leave.js');
const ShiftSchedule = require('./ShiftSchedule.js');
const UserShiftAssignment = require('./UserShiftAssignment.js');
const PayrollRecords = require('./PayrollRecords.js');
const PayRates = require('./PayRates.js');
const PayrollSettings = require('./PayrollSettings.js');
const Department = require('./Department.js');
const SubscriptionPlan = require('./SubscriptionPlan.js');
const Subscription = require('./Subscription.js');
const Payment = require('./Payment.js')


// User <-> Company
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

// User <-> Department
User.belongsTo(Department, { foreignKey: 'departmentId', as: 'Department' });
Department.hasMany(User, { foreignKey: 'departmentId', as: 'Users' });

// Department <-> Supervisor (User)
Department.belongsTo(User, { as: 'Supervisor', foreignKey: 'supervisorId' });
User.hasMany(Department, { foreignKey: 'supervisorId', as: 'SupervisedDepartments' });

// User <-> Location
User.hasMany(Location, { foreignKey: 'adminId', as: 'locations' });
Location.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
Location.belongsTo(User, { foreignKey: 'updatedBy', as: 'lastEditor' });

// User <-> TimeLogs
User.hasMany(TimeLogs, { foreignKey: 'userId', as: 'timeLogs' });
TimeLogs.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// UserSettings <-> User and Location
UserSettings.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(UserSettings, { foreignKey: 'userId', as: 'settings', onDelete: 'CASCADE' });

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

// SubscriptionPlan <-> Subscription
SubscriptionPlan.hasMany(Subscription, { foreignKey: 'planId', as: 'subscriptions' });
Subscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// Company <-> Subscription
Company.hasMany(Subscription, { foreignKey: 'companyId', as: 'subscriptions' });
Subscription.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

// Payment <-> Subscription
Subscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// Payment <-> Company
Company.hasMany(Payment, { foreignKey: 'companyId', as: 'payments' });
Payment.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

module.exports = {
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
  PayRates,
  Department,
  SubscriptionPlan,
  Subscription,
  Payment
};
