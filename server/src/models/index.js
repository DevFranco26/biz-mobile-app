// src/models/index.js

import User from './Users.js';
import Company from './Company.js';
import Location from './Location.js';
import TimeLogs from './TimeLogs.js';
import UserSettings from './UserSettings.js';
import Leave from './Leave.js'; // Import Leave model

// Define Associations

// User <-> Company
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });
Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });

// User <-> Location
User.hasMany(Location, { foreignKey: 'adminId', as: 'locations' });
Location.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

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

export {
  User,
  Company,
  Location,
  TimeLogs,
  UserSettings,
  Leave,
};
